const { publicUser } = require('./token');

function listingPayload(listing, distanceKm) {
  if (!listing) return null;

  const seller = listing.seller && listing.seller._id
    ? publicUser(listing.seller)
    : listing.seller;

  const shop = listing.shopId && listing.shopId._id
    ? {
        id: listing.shopId._id,
        name: listing.shopId.name,
        logo: listing.shopId.logo,
        ratingAverage: listing.shopId.ratingAverage,
        reviewCount: listing.shopId.reviewCount,
        isVerified: listing.shopId.isVerified,
      }
    : listing.shopId;

  return {
    id: listing._id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    category: listing.category,
    condition: listing.condition,
    photos: listing.photos,
    location: listing.location,
    coordinates: listing.coordinates,
    meetupOption: listing.meetupOption,
    status: listing.status,
    views: Number(listing.views) || 0,
    seller,
    sellerType: listing.sellerType || 'individual',
    shopId: shop,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    distanceKm:
      typeof distanceKm === 'number' && Number.isFinite(distanceKm)
        ? Math.round(distanceKm * 10) / 10
        : null,
  };
}

function parsePrice(value) {
  if (value == null || value === '') return NaN;
  return Number(String(value).replace(/,/g, '').replace(/[^\d.]/g, ''));
}

function haversineDistanceKm(aLat, aLng, bLat, bLng) {
  if (
    typeof aLat !== 'number' || typeof aLng !== 'number' ||
    typeof bLat !== 'number' || typeof bLng !== 'number'
  ) {
    return null;
  }
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

module.exports = { listingPayload, parsePrice, haversineDistanceKm };
