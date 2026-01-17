# Product Image Schema - Full + Thumbnails

## 📸 Enhanced Image Support

Your database now supports **multiple images per product** with both **full-size** and **thumbnail** URLs!

---

## 🗄️ Database Schema

### Product Schema with Images

```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  
  // NEW: Images array - supports multiple images
  images: [
    {
      url: String,          // Full-size image (e.g., 2000x2000)
      thumbnailUrl: String, // Thumbnail image (e.g., 340x270)
      alt: String,          // Alt text for accessibility
      isPrimary: Boolean    // True for the main product image
    }
  ],
  
  // Legacy: Backward compatibility
  imageUrl: String,  // Points to primary image URL
  
  stockQuantity: Number,
  isActive: Boolean,
  etsyListingId: String
}
```

---

## 🖼️ Image Sizes

### Etsy Image URL Formats

Etsy provides multiple image sizes:

| Size | Dimensions | URL Pattern | Use Case |
|------|------------|-------------|----------|
| **Full** | 2000x2000+ | `il_fullxfull` | Product detail page |
| **Large** | 794x794 | `il_794xN` | Gallery view |
| **Medium** | 570x570 | `il_570xN` | Medium previews |
| **Standard** | 340x270 | `il_340x270` | Thumbnails |
| **Small** | 170x135 | `il_170x135` | Small thumbnails |

### Example URLs

**Full-size:**
```
https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg
```

**Thumbnail:**
```
https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_340x270.2451554459_ij8l.jpg
```

Just replace `il_fullxfull` with `il_340x270`!

---

## 📱 Using Images in Mobile App

### Product List (Use Thumbnails)

```javascript
// In ProductCard.js or similar
import { Image } from 'react-native';

function ProductCard({ product }) {
  // Get the primary image
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  
  return (
    <Image
      source={{ uri: primaryImage.thumbnailUrl }}
      style={{ width: 100, height: 100 }}
      resizeMode="cover"
    />
  );
}
```

### Product Detail Page (Use Full Images)

```javascript
// In ProductDetail.js
import { Image, ScrollView } from 'react-native';

function ProductDetail({ product }) {
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  
  return (
    <ScrollView>
      {/* Main product image - full size */}
      <Image
        source={{ uri: primaryImage.url }}
        style={{ width: '100%', height: 400 }}
        resizeMode="contain"
      />
      
      {/* Image gallery - thumbnails */}
      <ScrollView horizontal>
        {product.images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image.thumbnailUrl }}
            style={{ width: 80, height: 80, margin: 5 }}
            accessible={true}
            accessibilityLabel={image.alt}
          />
        ))}
      </ScrollView>
    </ScrollView>
  );
}
```

---

## 🎯 Benefits

### Performance
- ✅ **Faster loading** - Thumbnails are smaller (50-100KB vs 500KB+)
- ✅ **Less bandwidth** - Product lists only load thumbnails
- ✅ **Smooth scrolling** - Smaller images = better performance

### User Experience
- ✅ **Quick preview** - Thumbnails load instantly
- ✅ **High quality details** - Full images show on detail page
- ✅ **Image galleries** - Support multiple product photos
- ✅ **Accessibility** - Alt text for screen readers

### Developer Experience
- ✅ **Flexible** - Easy to add more images later
- ✅ **Backward compatible** - Legacy `imageUrl` still works
- ✅ **Etsy integration** - Direct Etsy CDN URLs

---

## 🔧 Adding Multiple Images

### Example: Product with 3 Images

```javascript
{
  name: 'Turmeric Soap',
  price: 10.00,
  images: [
    {
      url: 'https://i.etsystatic.com/.../il_fullxfull.xxx_main.jpg',
      thumbnailUrl: 'https://i.etsystatic.com/.../il_340x270.xxx_main.jpg',
      alt: 'Turmeric soap - front view',
      isPrimary: true  // This is the main image
    },
    {
      url: 'https://i.etsystatic.com/.../il_fullxfull.xxx_side.jpg',
      thumbnailUrl: 'https://i.etsystatic.com/.../il_340x270.xxx_side.jpg',
      alt: 'Turmeric soap - side view',
      isPrimary: false
    },
    {
      url: 'https://i.etsystatic.com/.../il_fullxfull.xxx_packaging.jpg',
      thumbnailUrl: 'https://i.etsystatic.com/.../il_340x270.xxx_packaging.jpg',
      alt: 'Turmeric soap - packaging',
      isPrimary: false
    }
  ]
}
```

---

## 📊 API Response Examples

### GET /api/products

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Turmeric Ginger Latte Soap",
  "price": 10.00,
  "category": "soap",
  "images": [
    {
      "url": "https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg",
      "thumbnailUrl": "https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_340x270.2451554459_ij8l.jpg",
      "alt": "Turmeric Ginger Latte Soap - handmade natural soap",
      "isPrimary": true
    }
  ],
  "imageUrl": "https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg",
  "stockQuantity": 50,
  "etsyListingId": "717857432"
}
```

---

## 🔄 Migration from Old Schema

If you have products with only `imageUrl`:

### Option 1: Run the new import script
```bash
node sisters-promise-products-with-images.js
```

### Option 2: Migrate existing data
```javascript
// Migration script
db.products.find({ images: { $exists: false } }).forEach(product => {
  db.products.updateOne(
    { _id: product._id },
    {
      $set: {
        images: [{
          url: product.imageUrl,
          thumbnailUrl: product.imageUrl.replace('il_fullxfull', 'il_340x270'),
          alt: product.name,
          isPrimary: true
        }]
      }
    }
  );
});
```

---

## 🎨 Mobile App Updates

### Update API Client

```javascript
// src/services/api.js
export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data.map(product => ({
    ...product,
    // Ensure images array exists
    images: product.images || [{
      url: product.imageUrl,
      thumbnailUrl: product.imageUrl,
      alt: product.name,
      isPrimary: true
    }]
  }));
};
```

### Update Product Card Component

```javascript
// src/components/ProductCard.js
const ProductCard = ({ product }) => {
  const primaryImage = product.images?.find(img => img.isPrimary) 
    || product.images?.[0] 
    || { thumbnailUrl: product.imageUrl, alt: product.name };

  return (
    <TouchableOpacity onPress={() => navigateToDetail(product)}>
      <Image
        source={{ uri: primaryImage.thumbnailUrl }}
        style={styles.thumbnail}
        accessible={true}
        accessibilityLabel={primaryImage.alt}
      />
      <Text>{product.name}</Text>
      <Text>${product.price}</Text>
    </TouchableOpacity>
  );
};
```

### Update Product Detail Component

```javascript
// src/screens/ProductDetailScreen.js
const ProductDetailScreen = ({ route }) => {
  const { product } = route.params;
  const [selectedImage, setSelectedImage] = useState(
    product.images?.find(img => img.isPrimary) || product.images?.[0]
  );

  return (
    <ScrollView>
      {/* Main Image */}
      <Image
        source={{ uri: selectedImage.url }}
        style={styles.mainImage}
        resizeMode="contain"
      />
      
      {/* Thumbnail Gallery */}
      {product.images?.length > 1 && (
        <ScrollView horizontal style={styles.gallery}>
          {product.images.map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImage(image)}
            >
              <Image
                source={{ uri: image.thumbnailUrl }}
                style={[
                  styles.galleryThumb,
                  selectedImage === image && styles.selectedThumb
                ]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>${product.price}</Text>
      <Text style={styles.description}>{product.description}</Text>
    </ScrollView>
  );
};
```

---

## 📈 Performance Tips

### 1. Use Image Caching
```javascript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ 
    uri: image.thumbnailUrl,
    priority: FastImage.priority.high,
  }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 2. Lazy Load Full Images
```javascript
// Only load full image when user opens detail page
const [fullImageLoaded, setFullImageLoaded] = useState(false);

useEffect(() => {
  if (isDetailPageVisible) {
    setFullImageLoaded(true);
  }
}, [isDetailPageVisible]);
```

### 3. Prefetch Images
```javascript
import { Image } from 'react-native';

// Prefetch next product images
const prefetchImages = (products) => {
  products.forEach(product => {
    product.images.forEach(image => {
      Image.prefetch(image.thumbnailUrl);
    });
  });
};
```

---

## ✅ Checklist

- [x] Database schema supports images array
- [x] Each image has url + thumbnailUrl
- [x] Alt text for accessibility
- [x] Primary image marking
- [x] Backward compatible with imageUrl
- [x] Etsy CDN URLs included
- [x] Ready for multiple images per product

---

## 🚀 Quick Start

```bash
# Import products with image support
node sisters-promise-products-with-images.js

# Verify in MongoDB
mongosh sisters_promise
db.products.findOne({}, { images: 1 })

# Check the structure
{
  images: [
    {
      url: "...",
      thumbnailUrl: "...",
      alt: "...",
      isPrimary: true
    }
  ]
}
```

---

**Last Updated:** January 16, 2026  
**Status:** Production Ready  
**Image Support:** Full ✅ | Thumbnails ✅ | Multiple Images ✅
