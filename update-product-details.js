/**
 * Update Products with Detailed Information
 * Adds comprehensive product details for featured products
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const productDetails = [
  {
    // Sea Moss + Aloe Soap
    slug: 'seamoss-aloe',
    name: 'Sea Moss + Aloe Soap',
    description: 'Hydrating Sensitive Skin - Enriched with natural sea moss and aloe vera for nourished, moisturized skin.',
    shortDescription: 'A gentle, mineral-rich soap crafted to cleanse, hydrate, and soothe the skin. Made with sea moss and aloe vera, this formula supports healthy-looking skin while maintaining moisture balance. Ideal for daily use and sensitive skin.',
    price: 12.00,
    category: 'Soap',
    fullDescription: 'Handcrafted in small batches, this soap is designed to support healthy, balanced skin while leaving it soft, calm, and refreshed. Formulated with organic oils and botanicals, Sea Moss + Aloe Soap creates a creamy, gentle lather that cleanses without stripping the skin\'s natural moisture. The fresh, clean aroma offers a calming aromatherapy experience, making it ideal for daily use.',
    benefits: [
      'Helps hydrate and soften dry, stressed skin',
      'Supports a smooth, healthy-looking complexion',
      'Gently cleanses while maintaining moisture balance',
      'Suitable for sensitive and problem-prone skin'
    ],
    aromatherapy: 'Light, clean, and refreshing — promotes a sense of calm and renewal during your daily skincare ritual.',
    bestFor: 'Normal, dry, sensitive, and combination skin types. Crafted with intention and care, this soap is perfect for those seeking a clean, natural approach to everyday skincare.',
    keyIngredients: [
      {
        name: 'Sea Moss',
        description: 'Rich in natural minerals that help nourish and support the skin barrier',
        icon: 'fas fa-water'
      },
      {
        name: 'Aloe Vera',
        description: 'Known to calm, hydrate, and soothe irritated or dry skin',
        icon: 'fas fa-leaf'
      },
      {
        name: 'Organic Oils',
        description: 'Gently cleanse without stripping natural moisture',
        icon: 'fas fa-seedling'
      }
    ],
    howToUse: [
      'Lather onto wet skin',
      'Massage gently and rinse thoroughly',
      'Follow with your favorite Sister\'s Promise lotion'
    ],
    ingredients: 'Sodium Olivate (Olive Oil), Sodium Cocoate (Coconut Oil), Vitis Vinifera (Grape) Seed Oil, Vitamin E: Tocopherol, Sea Moss (Chondrus Crispus), Aloe Barbadensis Leaf, Water (Aqua), Sodium Hydroxide†',
    ingredientNote: '†Sodium hydroxide is used in the soapmaking process and is not present in the finished product.',
    images: [
      {
        url: './assets/img/Product/featureProduct01.png',
        thumbnailUrl: './assets/img/Product/featureProduct01.png',
        alt: 'Sea Moss + Aloe Soap',
        isPrimary: true
      }
    ],
    stockQuantity: 50,
    isActive: true
  },
  {
    // Turmeric Ginger Latte Soap
    slug: 'turmeric-ginger',
    name: 'Turmeric Ginger Latte Soap',
    description: 'Anti-Inflammatory & Aromatic - Soothing bar with turmeric and ginger for a luxurious experience.',
    shortDescription: 'A warm, nourishing soap made with turmeric and ginger to gently cleanse, soften, and support radiant-looking skin.',
    price: 10.00,
    category: 'Soap',
    fullDescription: 'Warm, comforting, and deeply nourishing, Turmeric Ginger Latte Soap is crafted to gently cleanse while supporting brighter-looking, healthier skin. This handcrafted bar blends turmeric and ginger with rich plant oils to create a creamy, luxurious lather that leaves skin feeling soft, smooth, and refreshed. Known for their skin-loving properties, turmeric and ginger help support a more even-looking complexion while providing a naturally comforting aromatherapy experience. The warm, earthy scent makes this soap especially soothing as part of a daily self-care ritual.',
    benefits: [
      'Helps promote a brighter, more even-looking complexion',
      'Gently cleanses while maintaining moisture',
      'Leaves skin feeling soft, smooth, and renewed',
      'Ideal for daily use and full-body cleansing'
    ],
    aromatherapy: 'Warm and grounding with subtle spice notes — encourages relaxation and balance.',
    bestFor: 'Normal, dry, combination, and dull-looking skin. Crafted with intention using clean, plant-based ingredients, this soap transforms everyday cleansing into a spa-like experience.',
    keyIngredients: [
      {
        name: 'Turmeric',
        description: 'Known to help brighten and even skin tone naturally',
        icon: 'fas fa-mortar-pestle'
      },
      {
        name: 'Ginger',
        description: 'Supports circulation and provides antioxidant benefits',
        icon: 'fas fa-fire'
      },
      {
        name: 'Plant Oils',
        description: 'Rich, nourishing oils for soft, supple skin',
        icon: 'fas fa-seedling'
      }
    ],
    howToUse: [
      'Wet skin with warm water',
      'Lather soap between hands or directly on body',
      'Massage gently in circular motions',
      'Rinse thoroughly and pat dry'
    ],
    ingredients: 'Sodium Olivate (Olive Oil), Sodium Cocoate (Coconut Oil), Turmeric Root Powder, Ginger Root Extract, Shea Butter, Water (Aqua), Sodium Hydroxide†',
    ingredientNote: '†Sodium hydroxide is used in the soapmaking process and is not present in the finished product.',
    images: [
      {
        url: './assets/img/Product/featureProduct02.png',
        thumbnailUrl: './assets/img/Product/featureProduct02.png',
        alt: 'Turmeric Ginger Latte Soap',
        isPrimary: true
      }
    ],
    stockQuantity: 45,
    isActive: true
  },
  {
    // Bath Salts
    slug: 'bath-salts',
    name: 'Aromatherapy Bath Salts',
    description: 'Aromatherapy Blend - Luxurious bath salts with essential oils for a soothing spa experience at home.',
    shortDescription: 'Transform your bath into a spa sanctuary with mineral-rich salts and essential oils for deep relaxation.',
    price: 16.00,
    category: 'Bath & Body',
    fullDescription: 'Indulge in the ultimate self-care ritual with our Aromatherapy Bath Salts. Blended with mineral-rich Epsom and sea salts, this luxurious soak helps ease tension, soothe tired muscles, and calm the mind. Enhanced with therapeutic essential oils, each bath becomes a restorative spa experience in the comfort of your home.',
    benefits: [
      'Helps relax tired, sore muscles',
      'Supports detoxification and skin renewal',
      'Promotes deep relaxation and stress relief',
      'Leaves skin feeling soft and refreshed'
    ],
    aromatherapy: 'Calming blend of lavender, eucalyptus, and chamomile — creates a peaceful, meditative atmosphere.',
    bestFor: 'All skin types. Perfect for evening self-care rituals, post-workout recovery, or anytime you need to unwind and recharge.',
    keyIngredients: [
      {
        name: 'Epsom Salt',
        description: 'Rich in magnesium to help soothe muscles and reduce tension',
        icon: 'fas fa-gem'
      },
      {
        name: 'Sea Salt',
        description: 'Mineral-rich salt that supports skin detoxification',
        icon: 'fas fa-water'
      },
      {
        name: 'Essential Oils',
        description: 'Pure botanical oils for aromatherapy and skin nourishment',
        icon: 'fas fa-spa'
      }
    ],
    howToUse: [
      'Fill bathtub with warm water',
      'Add 1/2 to 1 cup of bath salts under running water',
      'Stir to dissolve and release aromatic oils',
      'Soak for 20-30 minutes',
      'Rinse with fresh water and pat dry'
    ],
    ingredients: 'Magnesium Sulfate (Epsom Salt), Sea Salt, Lavandula Angustifolia (Lavender) Oil, Eucalyptus Globulus Oil, Chamomilla Recutita (Chamomile) Oil, Dried Botanicals',
    ingredientNote: 'External use only. Avoid if allergic to any ingredients.',
    images: [
      {
        url: './assets/img/Product/featureProduct03.png',
        thumbnailUrl: './assets/img/Product/featureProduct03.png',
        alt: 'Aromatherapy Bath Salts',
        isPrimary: true
      }
    ],
    stockQuantity: 30,
    isActive: true
  },
  {
    // Black Kush Body Lotion
    slug: 'black-kush-lotion',
    name: 'Black Kush Body Lotion',
    description: 'Deeply nourish and comfort your skin with Black Kush Body Lotion. This rich yet smooth formula is crafted to hydrate, soften, and protect the skin while delivering a warm, grounding aromatherapy experience.',
    shortDescription: 'Rich yet smooth formula that deeply hydrates and soothes with a warm, grounding scent. Perfect for daily moisturizing rituals.',
    mobileDescription: 'A rich, hydrating body lotion with a warm, grounding aroma that leaves skin soft, smooth, and deeply nourished.',
    price: 18.00,
    category: 'Lotion',
    fullDescription: 'Deeply nourish and comfort your skin with Black Kush Body Lotion. This rich yet smooth formula is crafted to hydrate, soften, and protect the skin while delivering a warm, grounding aromatherapy experience.\n\nInfused with botanical oils and a subtly earthy scent profile, this lotion absorbs beautifully into the skin, leaving it feeling moisturized, smooth, and balanced — never greasy. Ideal for daily use, it supports long-lasting hydration and a calm, relaxed feel.',
    benefits: [
      'Helps deeply hydrate and soften dry skin',
      'Absorbs smoothly for lasting moisture',
      'Leaves skin feeling calm, balanced, and nourished',
      'Ideal for daily moisturizing and self-care rituals'
    ],
    aromatherapy: 'Warm, earthy, and grounding — promotes relaxation and a sense of calm.',
    bestFor: 'Normal to dry skin types and those who enjoy warm, grounding scents.',
    keyIngredients: [
      {
        name: 'Botanical Oils',
        description: 'Rich blend of plant oils for deep hydration and nourishment',
        icon: 'fas fa-seedling'
      },
      {
        name: 'Shea Butter',
        description: 'Intensely moisturizing and helps protect the skin barrier',
        icon: 'fas fa-heart'
      },
      {
        name: 'Essential Oils',
        description: 'Natural aromatherapy for relaxation and balance',
        icon: 'fas fa-spa'
      }
    ],
    howToUse: [
      'Apply to clean, dry skin',
      'Massage gently in circular motions until fully absorbed',
      'Use daily or as needed for soft, hydrated skin',
      'Best applied after shower or bath for maximum absorption'
    ],
    ingredients: 'Water (Aqua), Butyrospermum Parkii (Shea Butter), Cocos Nucifera (Coconut) Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Emulsifying Wax NF, Vegetable Glycerin, Essential Oil Blend, Vitamin E (Tocopherol), Phenoxyethanol, Ethylhexylglycerin',
    ingredientNote: 'For external use only. Discontinue use if irritation occurs.',
    images: [
      {
        url: './assets/img/Product/black-kush-lotion.jpg',
        thumbnailUrl: './assets/img/Product/black-kush-lotion.jpg',
        alt: 'Black Kush Body Lotion',
        isPrimary: true
      }
    ],
    stockQuantity: 40,
    isActive: true
  },
  {
    // Lavender Sea Salt Soak
    slug: 'lavender-salt-soak',
    name: 'Lavender Sea Salt Soak',
    description: 'Calming bath soak with mineral-rich sea salt and soothing lavender for relaxation and soft skin.',
    shortDescription: 'Mineral-rich sea salt soak crafted to relax the body, soften the skin, and elevate your self-care ritual.',
    price: 16.00,
    category: 'Bath & Body',
    fullDescription: 'Unwind and restore with this calming Lavender Sea Salt Soak. Made with mineral-rich sea salt and soothing lavender, this soak is designed to relax the body, soften the skin, and ease the senses after a long day. As the salts dissolve into warm water, they help cleanse and refresh the skin while lavender\'s gentle aroma promotes relaxation and balance. Ideal for evening baths and moments of intentional self-care.',
    benefits: [
      'Helps relax the body and calm the mind',
      'Softens and refreshes the skin',
      'Supports stress relief and relaxation',
      'Perfect for nighttime rituals'
    ],
    aromatherapy: 'Soft, floral, and deeply calming — encourages rest and tranquility.',
    bestFor: 'All skin types. Perfect for evening relaxation and stress relief.',
    keyIngredients: [
      {
        name: 'Sea Salt',
        description: 'Mineral-rich salt that supports skin detoxification and renewal',
        icon: 'fas fa-water'
      },
      {
        name: 'Lavender',
        description: 'Calming botanical known to promote relaxation and ease',
        icon: 'fas fa-spa'
      },
      {
        name: 'Essential Oils',
        description: 'Pure botanical oils for aromatherapy benefits',
        icon: 'fas fa-leaf'
      }
    ],
    howToUse: [
      'Fill bathtub with warm water',
      'Add 1/2 to 1 cup of salt soak under running water',
      'Stir to dissolve and release aromatic oils',
      'Soak for 20-30 minutes',
      'Rinse with fresh water and pat dry'
    ],
    ingredients: 'Sea Salt, Magnesium Sulfate (Epsom Salt), Lavandula Angustifolia (Lavender) Oil, Dried Lavender Flowers',
    ingredientNote: 'For external use only. Avoid if allergic to any ingredients.',
    images: [
      {
        url: './assets/img/Product/lavender-salt-soak.jpg',
        thumbnailUrl: './assets/img/Product/lavender-salt-soak.jpg',
        alt: 'Lavender Sea Salt Soak',
        isPrimary: true
      }
    ],
    stockQuantity: 35,
    isActive: true
  },
  {
    // Chamomile Sea Salt Soak
    slug: 'chamomile-salt-soak',
    name: 'Chamomile Sea Salt Soak',
    description: 'Gentle bath soak with chamomile and sea salt to soothe sensitive skin and calm the senses.',
    shortDescription: 'Mineral-rich sea salt soak crafted to relax the body, soften the skin, and elevate your self-care ritual.',
    price: 16.00,
    category: 'Bath & Body',
    fullDescription: 'Soothe your skin and senses with this gentle Chamomile Sea Salt Soak. Thoughtfully crafted for moments when your body needs rest and your skin needs comfort, this soak offers a calming, spa-like bathing experience. Chamomile is known for its soothing properties, making this blend ideal for sensitive skin and relaxation-focused self-care. The warm, subtle aroma creates a peaceful atmosphere while sea salt helps refresh and soften the skin.',
    benefits: [
      'Helps calm and comfort sensitive skin',
      'Promotes relaxation and stress relief',
      'Leaves skin feeling soft and refreshed',
      'Gentle enough for frequent use'
    ],
    aromatherapy: 'Warm, soft, and comforting — promotes calm and emotional balance.',
    bestFor: 'Sensitive skin and those seeking gentle, calming self-care.',
    keyIngredients: [
      {
        name: 'Chamomile',
        description: 'Soothing botanical known to calm sensitive skin',
        icon: 'fas fa-spa'
      },
      {
        name: 'Sea Salt',
        description: 'Mineral-rich salt for skin softening and renewal',
        icon: 'fas fa-water'
      },
      {
        name: 'Essential Oils',
        description: 'Gentle aromatherapy for relaxation',
        icon: 'fas fa-leaf'
      }
    ],
    howToUse: [
      'Fill bathtub with warm water',
      'Add 1/2 to 1 cup of salt soak under running water',
      'Stir gently to dissolve',
      'Soak for 20-30 minutes',
      'Rinse and pat dry'
    ],
    ingredients: 'Sea Salt, Magnesium Sulfate (Epsom Salt), Chamomilla Recutita (Chamomile) Flower Extract, Chamomile Essential Oil, Dried Chamomile Flowers',
    ingredientNote: 'For external use only. Gentle formula suitable for sensitive skin.',
    images: [
      {
        url: './assets/img/Product/chamomile-salt-soak.jpg',
        thumbnailUrl: './assets/img/Product/chamomile-salt-soak.jpg',
        alt: 'Chamomile Sea Salt Soak',
        isPrimary: true
      }
    ],
    stockQuantity: 35,
    isActive: true
  },
  {
    // Rose & Geranium Sea Salt Soak
    slug: 'rose-geranium-salt-soak',
    name: 'Rose & Geranium Sea Salt Soak',
    description: 'Luxurious bath soak with rose and geranium to nourish skin and uplift spirits.',
    shortDescription: 'Mineral-rich sea salt soak crafted to relax the body, soften the skin, and elevate your self-care ritual.',
    price: 18.00,
    category: 'Bath & Body',
    fullDescription: 'Elevate your bath ritual with this luxurious Rose & Geranium Sea Salt Soak. Designed to nourish both skin and spirit, this blend combines mineral-rich sea salt with floral botanicals to create a deeply indulgent experience. Rose and geranium are known for their balancing and uplifting qualities, helping to soften the skin while enhancing mood. This soak turns everyday bathing into a moment of elegance and renewal.',
    benefits: [
      'Helps soften and refresh the skin',
      'Supports emotional balance and relaxation',
      'Creates a luxurious, spa-like bath experience',
      'Ideal for self-care and intentional rest'
    ],
    aromatherapy: 'Soft floral with warm undertones — uplifting, calming, and harmonizing.',
    bestFor: 'All skin types. Perfect for luxurious self-care rituals and emotional balance.',
    keyIngredients: [
      {
        name: 'Rose',
        description: 'Luxurious botanical known to soften and balance skin',
        icon: 'fas fa-spa'
      },
      {
        name: 'Geranium',
        description: 'Uplifting floral that supports emotional harmony',
        icon: 'fas fa-leaf'
      },
      {
        name: 'Sea Salt',
        description: 'Mineral-rich salt for skin renewal and detoxification',
        icon: 'fas fa-water'
      }
    ],
    howToUse: [
      'Fill bathtub with warm water',
      'Add 1/2 to 1 cup of salt soak under running water',
      'Stir to release floral aromatics',
      'Soak for 20-30 minutes for full benefits',
      'Rinse and pat dry'
    ],
    ingredients: 'Sea Salt, Magnesium Sulfate (Epsom Salt), Rosa Damascena (Rose) Oil, Pelargonium Graveolens (Geranium) Oil, Dried Rose Petals',
    ingredientNote: 'For external use only. Avoid if allergic to botanical ingredients.',
    images: [
      {
        url: './assets/img/Product/rose-geranium-salt-soak.jpg',
        thumbnailUrl: './assets/img/Product/rose-geranium-salt-soak.jpg',
        alt: 'Rose & Geranium Sea Salt Soak',
        isPrimary: true
      }
    ],
    stockQuantity: 30,
    isActive: true
  },
  {
    // Pink Sugar Body Lotion
    slug: 'pink-sugar-lotion',
    name: 'Pink Sugar Body Lotion',
    description: 'Indulge your skin in daily hydration with this lightweight yet deeply nourishing Pink Sugar Body Lotion. Crafted with skin-loving plant oils and botanical extracts, this lotion absorbs smoothly to help soften, hydrate, and protect the skin without feeling heavy or greasy.',
    shortDescription: 'Silky smooth body lotion that hydrates and softens skin with a gentle, comforting scent. Perfect for everyday use.',
    mobileDescription: 'A lightweight, nourishing body lotion that hydrates, softens, and leaves skin feeling silky smooth.',
    price: 18.00,
    category: 'Lotion',
    fullDescription: 'Indulge your skin in daily hydration with this lightweight yet deeply nourishing Pink Sugar Body Lotion. Crafted with skin-loving plant oils and botanical extracts, this lotion absorbs smoothly to help soften, hydrate, and protect the skin without feeling heavy or greasy.\n\nIts gentle, comforting aroma creates a soothing aromatherapy experience, making it ideal for daily moisturizing and moments of self-care. Designed to leave skin feeling silky and refreshed, this lotion supports a healthy, radiant appearance.',
    benefits: [
      'Helps hydrate and soften dry skin',
      'Absorbs easily for a smooth, non-greasy feel',
      'Leaves skin feeling silky and nourished',
      'Ideal for daily use and all skin types'
    ],
    aromatherapy: 'Soft, warm, and comforting — promotes relaxation and a sense of calm.',
    bestFor: 'All skin types, especially normal to dry skin.',
    keyIngredients: [
      {
        name: 'Plant Oils',
        description: 'Nourishing botanical oils for deep hydration',
        icon: 'fas fa-seedling'
      },
      {
        name: 'Shea Butter',
        description: 'Rich moisturizer that helps soften and protect skin',
        icon: 'fas fa-heart'
      },
      {
        name: 'Botanical Extracts',
        description: 'Skin-loving extracts for healthy, radiant appearance',
        icon: 'fas fa-leaf'
      }
    ],
    howToUse: [
      'Apply to clean, dry skin',
      'Massage gently until fully absorbed',
      'Use daily or as needed for soft, hydrated skin',
      'Perfect after shower or bath'
    ],
    ingredients: 'Water (Aqua), Butyrospermum Parkii (Shea Butter), Cocos Nucifera (Coconut) Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Emulsifying Wax NF, Vegetable Glycerin, Fragrance, Vitamin E (Tocopherol), Phenoxyethanol, Ethylhexylglycerin',
    ingredientNote: 'For external use only. Discontinue use if irritation occurs.',
    images: [
      {
        url: './assets/img/Product/pink-sugar-lotion.jpg',
        thumbnailUrl: './assets/img/Product/pink-sugar-lotion.jpg',
        alt: 'Pink Sugar Body Lotion',
        isPrimary: true
      }
    ],
    stockQuantity: 40,
    isActive: true
  },
  {
    // Organic Coffee Body Scrub
    slug: 'coffee-body-scrub',
    name: 'Organic Coffee Body Scrub',
    description: 'Energize and smooth your skin with this invigorating Organic Coffee Body Scrub. Crafted to gently exfoliate and nourish, this scrub helps buff away dry skin while leaving your body feeling soft, refreshed, and revitalized.',
    shortDescription: 'Energizing scrub that gently exfoliates and nourishes skin with organic coffee and conditioning oils.',
    mobileDescription: 'An energizing coffee scrub that exfoliates, smooths, and refreshes for soft, glowing skin.',
    price: 20.00,
    category: 'Scrub',
    fullDescription: 'Energize and smooth your skin with this invigorating Organic Coffee Body Scrub. Crafted to gently exfoliate and nourish, this scrub helps buff away dry skin while leaving your body feeling soft, refreshed, and revitalized. Finely ground organic coffee helps refine the skin\'s texture and is known to support a smoother, more toned appearance. Blended with conditioning oils, the scrub melts into the skin, delivering moisture while awakening the senses with its rich, comforting aroma. Perfect for use in the shower or bath, this scrub transforms your routine into a spa-like experience.',
    benefits: [
      'Gently exfoliates to smooth rough skin',
      'Helps refresh and revive dull-looking skin',
      'Leaves skin soft, hydrated, and polished',
      'Ideal for full-body exfoliation and self-care rituals'
    ],
    aromatherapy: 'Rich, warm, and energizing — helps awaken the senses and boost mood.',
    bestFor: 'All skin types, especially dull or dry skin.',
    keyIngredients: [
      {
        name: 'Organic Coffee',
        description: 'Finely ground to gently exfoliate and refine skin texture',
        icon: 'fas fa-coffee'
      },
      {
        name: 'Conditioning Oils',
        description: 'Nourishing oils that hydrate while exfoliating',
        icon: 'fas fa-seedling'
      },
      {
        name: 'Natural Exfoliants',
        description: 'Gentle buffing agents for smooth, polished skin',
        icon: 'fas fa-spa'
      }
    ],
    howToUse: [
      'Apply to damp skin in the shower or bath',
      'Massage gently in circular motions, focusing on rough areas',
      'Rinse thoroughly with warm water',
      'Use 2-3 times per week for best results',
      'Follow with your favorite Sister\'s Promise lotion'
    ],
    ingredients: 'Organic Coffee Grounds, Cocos Nucifera (Coconut) Oil, Sucrose (Sugar), Prunus Amygdalus Dulcis (Sweet Almond) Oil, Butyrospermum Parkii (Shea Butter), Vitamin E (Tocopherol), Coffee Essential Oil',
    ingredientNote: 'For external use only. Avoid use on broken or irritated skin.',
    images: [
      {
        url: './assets/img/Product/coffee-body-scrub.jpg',
        thumbnailUrl: './assets/img/Product/coffee-body-scrub.jpg',
        alt: 'Organic Coffee Body Scrub',
        isPrimary: true
      }
    ],
    stockQuantity: 35,
    isActive: true
  },
  {
    // Pink Himalayan Sea Salt Scrub
    slug: 'pink-himalayan-scrub',
    name: 'Pink Himalayan Sea Salt Scrub',
    description: 'Mineral-rich body scrub with Pink Himalayan sea salt to exfoliate, soften, and restore radiance.',
    shortDescription: 'Mineral-rich scrub with Pink Himalayan sea salt and nourishing oils for smooth, glowing skin.',
    mobileDescription: 'A mineral-rich body scrub made with Pink Himalayan sea salt to exfoliate, soften, and refresh the skin.',
    price: 22.00,
    category: 'Scrub',
    fullDescription: 'Reveal smoother, softer skin with this mineral-rich Pink Himalayan Sea Salt Scrub. Handcrafted with nourishing plant oils and fine pink salt, this exfoliating treatment gently buffs away dry skin while helping to restore softness and radiance. Pink Himalayan sea salt is naturally rich in minerals and is known for its ability to help cleanse and refine the skin\'s surface. As you massage the scrub onto damp skin, it melts into a conditioning oil blend, leaving skin feeling smooth, hydrated, and refreshed — never stripped. Perfect for elevating your self-care routine, this scrub delivers both physical exfoliation and a spa-like sensory experience.',
    benefits: [
      'Gently exfoliates to smooth rough, dry skin',
      'Helps cleanse and refresh the skin\'s surface',
      'Leaves skin soft, nourished, and glowing',
      'Ideal for full-body exfoliation and spa rituals'
    ],
    aromatherapy: 'Clean and calming — promotes relaxation and a refreshed sense of balance.',
    bestFor: 'All skin types, especially dry or dull-looking skin.',
    keyIngredients: [
      {
        name: 'Pink Himalayan Salt',
        description: 'Mineral-rich salt that helps cleanse and refine skin texture',
        icon: 'fas fa-gem'
      },
      {
        name: 'Nourishing Oils',
        description: 'Conditioning plant oils for hydration while exfoliating',
        icon: 'fas fa-seedling'
      },
      {
        name: 'Natural Minerals',
        description: 'Rich in trace minerals for skin vitality',
        icon: 'fas fa-spa'
      }
    ],
    howToUse: [
      'Apply to damp skin in the shower',
      'Massage gently in circular motions over entire body',
      'Focus on rough areas like elbows, knees, and feet',
      'Rinse thoroughly with warm water',
      'Use 2-3 times per week for glowing skin'
    ],
    ingredients: 'Pink Himalayan Sea Salt, Cocos Nucifera (Coconut) Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Butyrospermum Parkii (Shea Butter), Vitamin E (Tocopherol), Essential Oil Blend',
    ingredientNote: 'For external use only. Avoid use on broken or irritated skin.',
    images: [
      {
        url: './assets/img/Product/IMG_20201006_132825_089.jpg',
        thumbnailUrl: './assets/img/Product/IMG_20201006_132825_089.jpg',
        alt: 'Pink Himalayan Sea Salt Scrub',
        isPrimary: true
      }
    ],
    stockQuantity: 30,
    isActive: true
  },
  {
    // Pink Himalayan Sea Salt Soap
    slug: 'pink-himalayan-soap',
    name: 'Pink Himalayan Sea Salt Soap',
    description: 'Mineral-rich cleansing bar with Pink Himalayan sea salt for gentle exfoliation and purification.',
    shortDescription: 'Purifying soap with Pink Himalayan sea salt and plant oils to cleanse and refresh skin.',
    mobileDescription: 'A mineral-rich soap made with Pink Himalayan sea salt to gently cleanse, exfoliate, and refresh the skin.',
    price: 12.00,
    category: 'Soap',
    fullDescription: 'Purify and refresh your skin with this mineral-rich cleansing bar made with Pink Himalayan sea salt and gentle plant oils. Handcrafted in small batches, this soap is designed to cleanse deeply while helping maintain the skin\'s natural moisture balance.\n\nPink Himalayan sea salt is known for its natural mineral content and gentle exfoliating properties, helping to leave skin feeling smooth, refreshed, and renewed. The creamy lather cleanses without over-drying, making it suitable for regular use as part of a clean, holistic skincare routine.\n\nCrafted with care using simple, natural ingredients, this bar brings a spa-like experience to everyday cleansing.',
    benefits: [
      'Gently exfoliates to smooth and refresh the skin',
      'Helps cleanse and purify without stripping moisture',
      'Leaves skin feeling soft, balanced, and renewed',
      'Ideal for body cleansing and self-care rituals'
    ],
    aromatherapy: 'Clean and calming — promotes a sense of relaxation and renewal.',
    bestFor: 'Normal, combination, and oily skin types.',
    keyIngredients: [
      {
        name: 'Pink Himalayan Salt',
        description: 'Mineral-rich salt for gentle exfoliation and purification',
        icon: 'fas fa-gem'
      },
      {
        name: 'Plant Oils',
        description: 'Nourishing oils that cleanse while maintaining moisture',
        icon: 'fas fa-seedling'
      },
      {
        name: 'Natural Minerals',
        description: 'Trace minerals to help refresh and balance skin',
        icon: 'fas fa-water'
      }
    ],
    howToUse: [
      'Wet skin with warm water',
      'Lather soap between hands or directly on body',
      'Massage gently to cleanse',
      'Rinse thoroughly',
      'Use daily for clean, refreshed skin'
    ],
    ingredients: 'Sodium Olivate (Olive Oil), Sodium Cocoate (Coconut Oil), Pink Himalayan Sea Salt, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Water (Aqua), Sodium Hydroxide†',
    ingredientNote: '†Sodium hydroxide is used in the soapmaking process and is not present in the finished product.',
    images: [
      {
        url: './assets/img/Product/pink-himalayan-soap.jpg',
        thumbnailUrl: './assets/img/Product/pink-himalayan-soap.jpg',
        alt: 'Pink Himalayan Sea Salt Soap',
        isPrimary: true
      }
    ],
    stockQuantity: 45,
    isActive: true
  },
  {
    // Natural Loofah Sponge
    slug: 'natural-loofah-sponge',
    name: 'Natural Loofah Sponge',
    description: 'Gently exfoliate and refresh your skin with this Natural Loofah Sponge. Made from plant-based fibers, this loofah helps remove dead skin cells while promoting smoother, softer-looking skin.',
    shortDescription: 'Plant-based loofah for gentle exfoliation and skin renewal.',
    mobileDescription: 'A plant-based loofah sponge designed to gently exfoliate and refresh the skin for a smooth, healthy glow.',
    price: 10.00,
    category: 'Bath Accessories',
    fullDescription: 'Gently exfoliate and refresh your skin with this Natural Loofah Sponge. Made from plant-based fibers, this loofah helps remove dead skin cells while promoting smoother, softer-looking skin.\n\nDesigned for use in the bath or shower, it creates a gentle exfoliating experience that supports healthy skin renewal without harsh abrasion. With regular use, skin feels clean, polished, and refreshed.',
    benefits: [
      'Gently exfoliates to remove dry, dull skin',
      'Helps smooth and soften the skin\'s surface',
      'Supports healthy-looking skin texture',
      'Ideal for daily or weekly exfoliation'
    ],
    aromatherapy: null,
    bestFor: 'All skin types. Use gently on sensitive skin.',
    keyIngredients: [
      {
        name: 'Natural Loofah Fibers',
        description: 'Plant-based fibers that gently exfoliate skin',
        icon: 'fas fa-leaf'
      },
      {
        name: 'Biodegradable Material',
        description: 'Eco-friendly and naturally sustainable',
        icon: 'fas fa-recycle'
      }
    ],
    howToUse: [
      'Wet loofah and apply your favorite soap or body wash',
      'Massage onto skin using light circular motions',
      'Rinse thoroughly after use',
      'Hang to dry in a well-ventilated area',
      'Replace every 3-4 weeks for best results'
    ],
    ingredients: '100% Natural Loofah Plant Fibers (Luffa aegyptiaca)',
    ingredientNote: 'To extend the life of your loofah, rinse thoroughly after each use and allow to dry completely. Replace regularly for optimal hygiene.',
    images: [
      {
        url: './assets/img/Product/natural-loofah-sponge.jpg',
        thumbnailUrl: './assets/img/Product/natural-loofah-sponge.jpg',
        alt: 'Natural Loofah Sponge',
        isPrimary: true
      }
    ],
    stockQuantity: 60,
    isActive: true
  },
  {
    // Turmeric Ginger Latte Soap
    slug: 'turmeric-ginger-latte-soap',
    name: 'Turmeric Ginger Latte Soap',
    description: 'Warm, comforting, and deeply nourishing, Turmeric Ginger Latte Soap is crafted to gently cleanse while supporting brighter-looking, healthier skin.',
    shortDescription: 'Nourishing soap with turmeric and ginger to brighten and cleanse.',
    mobileDescription: 'A warm, nourishing soap made with turmeric and ginger to gently cleanse, soften, and support radiant-looking skin.',
    price: 12.00,
    category: 'Soap',
    fullDescription: 'Warm, comforting, and deeply nourishing, Turmeric Ginger Latte Soap is crafted to gently cleanse while supporting brighter-looking, healthier skin. This handcrafted bar blends turmeric and ginger with rich plant oils to create a creamy, luxurious lather that leaves skin feeling soft, smooth, and refreshed.\n\nKnown for their skin-loving properties, turmeric and ginger help support a more even-looking complexion while providing a naturally comforting aromatherapy experience. The warm, earthy scent makes this soap especially soothing as part of a daily self-care ritual.\n\nCrafted with intention using clean, plant-based ingredients, this soap transforms everyday cleansing into a spa-like experience.',
    benefits: [
      'Helps promote a brighter, more even-looking complexion',
      'Gently cleanses while maintaining moisture',
      'Leaves skin feeling soft, smooth, and renewed',
      'Ideal for daily use and full-body cleansing'
    ],
    aromatherapy: 'Warm and grounding with subtle spice notes — encourages relaxation and balance.',
    bestFor: 'Normal, dry, combination, and dull-looking skin.',
    keyIngredients: [
      {
        name: 'Turmeric',
        description: 'Known for supporting brighter, more even-looking skin',
        icon: 'fas fa-mortar-pestle'
      },
      {
        name: 'Ginger',
        description: 'Warming spice that helps soothe and comfort skin',
        icon: 'fas fa-pepper-hot'
      },
      {
        name: 'Plant Oils',
        description: 'Rich oils that cleanse while maintaining moisture',
        icon: 'fas fa-seedling'
      }
    ],
    howToUse: [
      'Wet skin with warm water',
      'Lather soap between hands or directly on body',
      'Massage gently onto skin in circular motions',
      'Rinse thoroughly with water',
      'Use daily for clean, radiant-looking skin'
    ],
    ingredients: 'Sodium Olivate (Olive Oil), Sodium Cocoate (Coconut Oil), Curcuma Longa (Turmeric) Powder, Zingiber Officinale (Ginger) Extract, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Water (Aqua), Sodium Hydroxide†, Natural Fragrance',
    ingredientNote: '†Sodium hydroxide is used in the soapmaking process and is not present in the finished product.',
    images: [
      {
        url: './assets/img/Product/turmeric-ginger-soap.jpg',
        thumbnailUrl: './assets/img/Product/turmeric-ginger-soap.jpg',
        alt: 'Turmeric Ginger Latte Soap',
        isPrimary: true
      }
    ],
    stockQuantity: 50,
    isActive: true
  }
];

async function updateProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    for (const productData of productDetails) {
      const { slug, ...data } = productData;
      
      console.log(`📦 Updating product: ${data.name}`);
      
      // Try to find by name first
      let product = await Product.findOne({ name: data.name });
      
      if (product) {
        // Update existing product
        Object.assign(product, data);
        await product.save();
        console.log(`   ✅ Updated existing product: ${product.name}`);
      } else {
        // Create new product
        product = new Product(data);
        await product.save();
        console.log(`   ✅ Created new product: ${product.name}`);
      }
      
      console.log(`   📝 Product ID: ${product._id}\n`);
    }

    console.log('✅ All products updated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Restart the backend server: npm start');
    console.log('  2. Test product detail pages in browser');
    console.log('  3. Products are now accessible via:');
    console.log('     - /pages/product-detail.html?id=<product-id>');
    console.log('     - API: /api/products/<product-id>\n');

  } catch (error) {
    console.error('❌ Error updating products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

updateProducts();
