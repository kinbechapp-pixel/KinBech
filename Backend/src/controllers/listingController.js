const Listing = require('../models/Listing');
const Shop = require('../models/Shop');
const { listingPayload, parsePrice, haversineDistanceKm } = require('../utils/listing');

function buildBaseFilter(req) {
  const {
    q,
    category,
    status = 'active',
    seller,
    minPrice,
    maxPrice,
    condition,
  } = req.query;

  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (category && category !== 'All' && category !== 'More') {
    filter.category = category;
  }
  if (condition && condition !== 'All') filter.condition = condition;
  if (seller) filter.seller = seller;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (q) {
    const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
      { location: { $regex: escaped, $options: 'i' } },
      { category: { $regex: escaped, $options: 'i' } },
    ];
  }
  return filter;
}

async function getListings(req, res, next) {
  try {
    const filter = buildBaseFilter(req);
    const {
      lat, lng, radius, sort,
    } = req.query;

    const userLat = lat != null && lat !== '' ? Number(lat) : null;
    const userLng = lng != null && lng !== '' ? Number(lng) : null;
    const radiusKm = radius && Number(radius) > 0 ? Number(radius) : null;
    const sortMode = String(sort || 'newest').toLowerCase();

    const mongoSort = {};
    if (sortMode === 'price-low') {
      mongoSort.price = 1;
    } else if (sortMode === 'price-high') {
      mongoSort.price = -1;
    } else {
      mongoSort.createdAt = -1;
    }

    const docs = await Listing.find(filter)
      .populate('seller', 'name phone avatarUrl soldCount boughtCount')
      .populate('shopId', 'name logo ratingAverage reviewCount')
      .sort(mongoSort)
      .limit(300)
      .lean();

    const withDistance = docs.map((doc) => {
      const lLat = doc?.coordinates?.lat;
      const lLng = doc?.coordinates?.lng;
      if (userLat != null && userLng != null) {
        const km = haversineDistanceKm(userLat, userLng, lLat, lLng);
        return { doc, distance: km };
      }
      return { doc, distance: null };
    });

    const filteredByRadius = withDistance.filter(({ distance }) => {
      if (!radiusKm) return true;
      if (distance == null) return false;
      return distance <= radiusKm;
    });

    let final;
    if (sortMode === 'distance' && userLat != null && userLng != null) {
      final = filteredByRadius.slice().sort((a, b) => {
        const da = a.distance == null ? Infinity : a.distance;
        const db = b.distance == null ? Infinity : b.distance;
        return da - db;
      });
    } else if (sortMode === 'price-low') {
      final = filteredByRadius.slice().sort((a, b) => a.doc.price - b.doc.price);
    } else if (sortMode === 'price-high') {
      final = filteredByRadius.slice().sort((a, b) => b.doc.price - a.doc.price);
    } else {
      final = filteredByRadius.slice().sort((a, b) => {
        const ta = new Date(a.doc.createdAt || 0).getTime();
        const tb = new Date(b.doc.createdAt || 0).getTime();
        return tb - ta;
      });
    }

    res.json({
      listings: final.map(({ doc, distance }) => listingPayload(doc, distance)),
      total: final.length,
      appliedSort: sortMode,
    });
  } catch (error) {
    next(error);
  }
}

async function searchListings(req, res, next) {
  try {
    const filter = buildBaseFilter(req);
    const {
      lat, lng, radius, sort,
    } = req.query;

    const userLat = lat != null && lat !== '' ? Number(lat) : null;
    const userLng = lng != null && lng !== '' ? Number(lng) : null;
    const radiusKm = radius && Number(radius) > 0 ? Number(radius) : null;
    const sortMode = String(sort || 'distance').toLowerCase();

    const docs = await Listing.find(filter)
      .populate('seller', 'name phone avatarUrl rating soldCount boughtCount')
      .limit(500)
      .lean();

    const ranked = docs.map((doc) => {
      const lLat = doc?.coordinates?.lat;
      const lLng = doc?.coordinates?.lng;
      let distance = null;
      if (userLat != null && userLng != null) {
        distance = haversineDistanceKm(userLat, userLng, lLat, lLng);
      }

      let relevanceScore = 0;
      const q = (req.query.q || '').toString().trim().toLowerCase();
      if (q) {
        const title = (doc.title || '').toLowerCase();
        const desc = (doc.description || '').toLowerCase();
        const loc = (doc.location || '').toLowerCase();
        const cat = (doc.category || '').toLowerCase();
        if (title === q) relevanceScore += 50;
        if (title.startsWith(q)) relevanceScore += 20;
        if (title.includes(q)) relevanceScore += 10;
        if (cat.includes(q)) relevanceScore += 15;
        if (loc.includes(q)) relevanceScore += 8;
        if (desc.includes(q)) relevanceScore += 4;
      }
      return { doc, distance, relevance: relevanceScore };
    });

    const filtered = ranked.filter(({ distance }) => {
      if (!radiusKm) return true;
      if (distance == null) return false;
      return distance <= radiusKm;
    });

    let sorted = filtered.slice();
    if (sortMode === 'distance' && userLat != null && userLng != null) {
      sorted.sort((a, b) => {
        const da = a.distance == null ? Infinity : a.distance;
        const db = b.distance == null ? Infinity : b.distance;
        const diff = da - db;
        if (Math.abs(diff) > 5) return diff;
        return b.relevance - a.relevance;
      });
    } else if (sortMode === 'relevance') {
      sorted.sort((a, b) => {
        const diff = b.relevance - a.relevance;
        if (diff !== 0) return diff;
        const da = a.distance == null ? Infinity : a.distance;
        const db = b.distance == null ? Infinity : b.distance;
        return da - db;
      });
    } else if (sortMode === 'price-low') {
      sorted.sort((a, b) => a.doc.price - b.doc.price);
    } else if (sortMode === 'price-high') {
      sorted.sort((a, b) => b.doc.price - a.doc.price);
    } else if (sortMode === 'newest') {
      sorted.sort((a, b) => {
        const ta = new Date(a.doc.createdAt || 0).getTime();
        const tb = new Date(b.doc.createdAt || 0).getTime();
        return tb - ta;
      });
    } else {
      sorted.sort((a, b) => {
        const da = a.distance == null ? Infinity : a.distance;
        const db = b.distance == null ? Infinity : b.distance;
        const diff = da - db;
        if (Math.abs(diff) > 5) return diff;
        return b.relevance - a.relevance;
      });
    }

    res.json({
      listings: sorted.map(({ doc, distance }) => listingPayload(doc, distance)),
      total: sorted.length,
      appliedSort: sortMode,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyListings(req, res, next) {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .populate('seller', 'name phone avatarUrl soldCount boughtCount')
      .populate('shopId', 'name logo ratingAverage reviewCount')
      .sort({ createdAt: -1 });

    res.json({ listings: listings.map(listingPayload) });
  } catch (error) {
    next(error);
  }
}

async function getListing(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const userLat = lat != null && lat !== '' ? Number(lat) : null;
    const userLng = lng != null && lng !== '' ? Number(lng) : null;

    const doc = await Listing.findById(req.params.id)
      .populate('seller', 'name phone avatarUrl soldCount boughtCount')
      .populate('shopId', 'name logo ratingAverage reviewCount');

    if (!doc) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    try {
      doc.views = (Number(doc.views) || 0) + 1;
      await doc.save();
    } catch (e) {
      // Ignore increment failures
    }

    let distance = null;
    const lLat = doc?.coordinates?.lat;
    const lLng = doc?.coordinates?.lng;
    if (userLat != null && userLng != null) {
      distance = haversineDistanceKm(userLat, userLng, lLat, lLng);
    }

    res.json({ listing: listingPayload(doc, distance) });
  } catch (error) {
    next(error);
  }
}

async function incrementView(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Listing id required' });
    }
    await Listing.updateOne(
      { _id: id },
      { $inc: { views: 1 } }
    ).exec();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

async function createListing(req, res, next) {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      photos,
      location,
      coordinates,
      meetupOption,
      sellerType = 'individual',
      shopId,
      // Shop-specific fields
      stock,
      brand,
      sku,
      originalPrice,
      isOnSale,
    } = req.body;

    const parsedPrice = parsePrice(price);
    if (!title || Number.isNaN(parsedPrice) || !category) {
      return res.status(400).json({ message: 'Title, price, and category are required' });
    }

    // Validate seller type
    if (!['individual', 'shop'].includes(sellerType)) {
      return res.status(400).json({ message: 'Invalid seller type' });
    }

    // If shop listing, validate shopId
    if (sellerType === 'shop') {
      if (!shopId) {
        return res.status(400).json({ message: 'Shop ID is required for shop listings' });
      }

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Verify user owns the shop
      if (String(shop.owner) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You can only create listings for your own shop' });
      }

      // Use shop location if listing location not provided
      if (!location && shop.location) {
        listingData.location = shop.location;
      }
      if (!coordinates && shop.coordinates) {
        listingData.coordinates = shop.coordinates;
      }
    }

    const listingData = {
      seller: req.user._id,
      sellerType,
      title: String(title).trim(),
      description: description || '',
      price: parsedPrice,
      category,
      condition: condition || 'Good',
      photos: Array.isArray(photos) ? photos : [],
      location: location || '',
      coordinates: coordinates && (coordinates.lat != null || coordinates.lng != null)
        ? { lat: Number(coordinates.lat) || null, lng: Number(coordinates.lng) || null }
        : { lat: null, lng: null },
      meetupOption: meetupOption || 'Public place',
    };

    // Add shop-specific fields
    if (sellerType === 'shop') {
      listingData.shopId = shopId;
      listingData.stock = stock || 1;
      listingData.brand = brand || '';
      listingData.sku = sku || '';
      listingData.originalPrice = originalPrice || null;
      listingData.isOnSale = isOnSale || false;
    }

    const listing = await Listing.create(listingData);

    await listing.populate('seller', 'name phone avatarUrl soldCount boughtCount');
    if (listing.shopId) {
      await listing.populate('shopId', 'name logo ratingAverage reviewCount');
    }

    res.status(201).json({ listing: listingPayload(listing) });
  } catch (error) {
    next(error);
  }
}

async function updateListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (String(listing.seller) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own listing' });
    }

    // For shop listings, ensure user still owns the shop
    if (listing.sellerType === 'shop' && listing.shopId) {
      const shop = await Shop.findById(listing.shopId);
      if (!shop || String(shop.owner) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You can only edit listings for your own shop' });
      }
    }

    const fields = [
      'title',
      'description',
      'category',
      'condition',
      'photos',
      'location',
      'meetupOption',
      'status',
      // Shop-specific fields
      'stock',
      'brand',
      'sku',
      'originalPrice',
      'isOnSale',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    if (req.body.coordinates) {
      const c = req.body.coordinates;
      listing.coordinates = {
        lat: c.lat != null ? Number(c.lat) || null : listing.coordinates?.lat,
        lng: c.lng != null ? Number(c.lng) || null : listing.coordinates?.lng,
      };
    }

    if (req.body.price !== undefined) {
      const parsedPrice = parsePrice(req.body.price);
      if (Number.isNaN(parsedPrice)) {
        return res.status(400).json({ message: 'Invalid price' });
      }
      listing.price = parsedPrice;
    }

    if (req.body.markSold) {
      listing.status = 'sold';
    }

    await listing.save();
    await listing.populate('seller', 'name phone avatarUrl rating soldCount boughtCount');
    res.json({ listing: listingPayload(listing) });
  } catch (error) {
    next(error);
  }
}

async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (String(listing.seller) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own listing' });
    }
    await listing.deleteOne();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getListings,
  searchListings,
  getMyListings,
  getListing,
  incrementView,
  createListing,
  updateListing,
  deleteListing,
};
