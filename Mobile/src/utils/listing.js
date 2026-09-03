import { NEPAL_LOCATIONS, haversineKm } from './locations';

const CATEGORY_ICONS = {
  Mobiles: 'phone-portrait-outline',
  Laptops: 'laptop-outline',
  Electronics: 'headset-outline',
  Furniture: 'file-tray-stacked-outline',
  Vehicles: 'car-outline',
  'Sports & Fitness': 'bicycle-outline',
  Fashion: 'shirt-outline',
};

export function formatPrice(price) {
  const amount = Number(price) || 0;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function timeAgo(dateValue) {
  if (!dateValue) return '';
  const then = new Date(dateValue).getTime();
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `Posted ${days} day${days === 1 ? '' : 's'} ago`;
}

export function categoryIcon(category) {
  return CATEGORY_ICONS[category] || 'cube-outline';
}

export function formatDistanceLabel(km) {
  if (km == null || !Number.isFinite(km)) {
    return null;
  }
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function resolveListingCoords(listing) {
  if (!listing) return null;
  if (listing.coordinates) {
    const c = listing.coordinates;
    const lat = Number(c.lat != null ? c.lat : c.latitude);
    const lng = Number(c.lng != null ? c.lng : c.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  const lat = Number(listing.lat != null ? listing.lat : listing.latitude);
  const lng = Number(listing.lng != null ? listing.lng : listing.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  const locName = (listing.location || '').toString().toLowerCase().trim();
  if (locName && NEPAL_LOCATIONS.length) {
    let best = null;
    let bestScore = -1;
    for (const loc of NEPAL_LOCATIONS) {
      const n = loc.name.toLowerCase();
      let score = 0;
      if (n === locName) score = 1000;
      else if (n.startsWith(locName)) score = 500;
      else if (locName.startsWith(n.split(',')[0])) score = 300;
      else if (n.includes(locName)) score = 100;
      else {
        const tokens = locName.split(/[,\s]+/).filter(Boolean);
        for (const t of tokens) {
          if (t.length >= 3 && n.includes(t)) score += 20;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = loc;
      }
    }
    if (best && bestScore > 0) {
      return { lat: best.lat, lng: best.lng, fromFallback: true };
    }
  }
  return null;
}

export function attachDistanceToCard(cardItem, userCoords) {
  if (!cardItem) return cardItem;
  if (cardItem.distanceKm != null && Number.isFinite(Number(cardItem.distanceKm))) {
    return {
      ...cardItem,
      distanceLabel: formatDistanceLabel(Number(cardItem.distanceKm)),
    };
  }
  const coords = resolveListingCoords(cardItem.listing || cardItem);
  if (userCoords?.lat != null && userCoords?.lng != null && coords) {
    const d = haversineKm(
      Number(userCoords.lat),
      Number(userCoords.lng),
      Number(coords.lat),
      Number(coords.lng)
    );
    return {
      ...cardItem,
      distanceKm: d,
      distanceLabel: formatDistanceLabel(d),
      coordinates: coords,
    };
  }
  return cardItem;
}

export function toCardItem(listing) {
  if (!listing) return null;
  const coords = resolveListingCoords(listing);
  return {
    id: listing.id,
    title: listing.title,
    price: formatPrice(listing.price),
    category: listing.category || '',
    location: listing.location || '',
    icon: categoryIcon(listing.category),
    imageColor: 'iconBackground',
    photo: listing.photos?.[0] || '',
    views: Number(listing.views) || 0,
    distanceKm: listing.distanceKm != null ? Number(listing.distanceKm) : null,
    distanceLabel: formatDistanceLabel(listing.distanceKm),
    coordinates: coords,
    listing,
  };
}

export function toDetailItem(listing) {
  if (!listing) return null;
  const seller = listing.seller || {};
  return {
    id: listing.id,
    title: listing.title,
    price: formatPrice(listing.price),
    condition: listing.condition || 'Good',
    location: listing.location || '',
    posted: timeAgo(listing.createdAt),
    seller: seller.name || 'Seller',
    sellerId: seller.id,
    sellerData: seller,
    rating: seller.rating ? `${seller.rating}` : 'New seller',
    description: listing.description || '',
    mapAddress: listing.location || '',
    photos: listing.photos || [],
    listing,
  };
}

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function fullPhone(localDigits) {
  const digits = digitsOnly(localDigits).slice(-10);
  return digits ? `+977${digits}` : '';
}
