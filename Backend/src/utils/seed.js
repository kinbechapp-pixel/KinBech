const User = require('../models/User');
const Listing = require('../models/Listing');

const SEED_PHONE = '+9779800000000';

const SAMPLE_LISTINGS = [
  {
    title: 'iPhone 13 Pro 128GB',
    description: 'Very good condition. Battery health 88%. Box and charger included.',
    price: 45999,
    category: 'Mobiles',
    condition: 'Good',
    location: 'Kathmandu, Bagmati',
    coordinates: { lat: 27.7172, lng: 85.3240 },
  },
  {
    title: 'MacBook Air M1 (2020)',
    description: '8GB RAM, 256GB SSD. Original charger. Perfect for students.',
    price: 55000,
    category: 'Laptops',
    condition: 'Good',
    location: 'Lalitpur, Bagmati',
    coordinates: { lat: 27.6728, lng: 85.3116 },
  },
  {
    title: 'Sony WH-1000XM4',
    description: 'Noise cancelling headphones. Light use, works perfectly.',
    price: 8999,
    category: 'Electronics',
    condition: 'Good',
    location: 'Bhaktapur, Bagmati',
    coordinates: { lat: 27.6717, lng: 85.4293 },
  },
  {
    title: '3 Seater Sofa',
    description: 'Comfortable fabric sofa. Minor wear on armrests.',
    price: 12500,
    category: 'Furniture',
    condition: 'Fair',
    location: 'Kathmandu, Bagmati',
    coordinates: { lat: 27.7064, lng: 85.3214 },
  },
  {
    title: 'Hero Sprint Cycle',
    description: '21 speed gear cycle. Recently serviced.',
    price: 6500,
    category: 'More',
    condition: 'Good',
    location: 'Lalitpur, Bagmati',
    coordinates: { lat: 27.6664, lng: 85.3236 },
  },
  {
    title: 'Samsung 43" Smart TV',
    description: 'Full HD smart TV. Remote included.',
    price: 22500,
    category: 'Electronics',
    condition: 'Good',
    location: 'Kathmandu, Bagmati',
    coordinates: { lat: 27.7025, lng: 85.3186 },
  },
  {
    title: 'Canon EOS 200D II',
    description: '24.1MP DSLR with 18-55mm lens. Low shutter count.',
    price: 28000,
    category: 'Electronics',
    condition: 'New',
    location: 'Kathmandu, Bagmati',
    coordinates: { lat: 27.7221, lng: 85.3330 },
  },
  {
    title: 'Study Table',
    description: 'Wooden study table with drawer. Solid and stable.',
    price: 3800,
    category: 'Furniture',
    condition: 'Good',
    location: 'Bhaktapur, Bagmati',
    coordinates: { lat: 27.6731, lng: 85.4361 },
  },
];

async function seedIfEmpty() {
  const listingCount = await Listing.countDocuments();
  if (listingCount > 0) {
    return;
  }

  let seller = await User.findOne({ phone: SEED_PHONE });
  if (!seller) {
    seller = await User.create({
      name: 'KinBech Demo',
      phone: SEED_PHONE,
      rating: 4.8,
      soldCount: 12,
    });
  }

  await Listing.insertMany(
    SAMPLE_LISTINGS.map((item) => ({
      ...item,
      seller: seller._id,
      photos: [],
      meetupOption: 'Public place',
      status: 'active',
    }))
  );

  console.log(`Seeded ${SAMPLE_LISTINGS.length} demo listings`);
}

module.exports = { seedIfEmpty };
