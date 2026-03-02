/**
 * Seed script: Creates 4 initial blog posts for Sister's Promise
 * Run: node seed-blog-posts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const BlogPost = require('./models/BlogPost');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters-promise';

const seedPosts = [
  {
    id: uuidv4(),
    title: 'Why Sea Moss Is the Ultimate Skincare Ingredient',
    slug: 'why-sea-moss-is-the-ultimate-skincare-ingredient-' + uuidv4().slice(0, 8),
    content: `<h2>The Ocean's Best-Kept Beauty Secret</h2>
<p>Sea moss, also known as Irish moss or <em>Chondrus crispus</em>, has been used for centuries in Caribbean and Irish cultures for its remarkable health benefits. But it's only recently that the skincare world has caught on to what our ancestors already knew — this humble seaweed is a powerhouse for your skin.</p>

<h3>Packed with 92 Essential Minerals</h3>
<p>Sea moss contains 92 of the 102 minerals our bodies need, including zinc, sulfur, calcium, potassium, and vitamins A, C, E, and K. When applied topically, these nutrients work together to nourish and rejuvenate your skin from the outside in.</p>

<h3>Natural Hydration That Lasts</h3>
<p>Unlike synthetic moisturizers that sit on top of your skin, sea moss produces a natural gel that penetrates deep into your pores. Its mucilaginous texture creates a breathable barrier that locks in moisture without clogging pores — perfect for all skin types.</p>

<h3>Fights Acne and Inflammation</h3>
<p>The sulfur content in sea moss has natural antibacterial and antimicrobial properties. This makes it excellent for combating acne-causing bacteria while its anti-inflammatory compounds soothe redness and irritation.</p>

<h3>How We Use It at Sister's Promise</h3>
<p>Every bar of our Sea Moss & Aloe soap is handcrafted with wildcrafted sea moss gel. We combine it with organic aloe vera to create a gentle, cleansing bar that leaves your skin feeling soft, hydrated, and renewed. No harsh chemicals, no synthetic fragrances — just nature's best ingredients working in harmony.</p>

<p>Ready to experience the difference? <a href="../pages/shop.html">Shop our Sea Moss collection</a> and let your skin thank you.</p>`,
    excerpt: 'Discover why sea moss is taking the skincare world by storm. Packed with 92 essential minerals, this ocean superfood hydrates, fights acne, and rejuvenates your skin naturally.',
    coverImage: '/assets/img/blog/sea_moss_skincare_1772477470206.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['sea moss', 'skincare', 'natural ingredients', 'wellness'],
    category: 'Ingredients',
    isPublished: true,
    publishedAt: new Date('2025-12-01'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 24,
    isDeleted: false
  },
  {
    id: uuidv4(),
    title: '5 Morning Skincare Habits That Changed My Life',
    slug: '5-morning-skincare-habits-that-changed-my-life-' + uuidv4().slice(0, 8),
    content: `<h2>Small Changes, Big Results</h2>
<p>I used to wake up, splash water on my face, and rush out the door. Sound familiar? It wasn't until I committed to a simple morning routine that I started seeing real changes in my skin. Here are the five habits that transformed my complexion — and they're easier than you think.</p>

<h3>1. Hydrate Before You Caffeinate</h3>
<p>Before reaching for that coffee, drink a full glass of water. After 6-8 hours of sleep, your body (and skin) is dehydrated. Starting with water kickstarts your metabolism and gives your skin cells the hydration they need to look plump and radiant.</p>

<h3>2. Gentle Cleansing, Not Stripping</h3>
<p>Ditch the harsh foaming cleansers. Your morning wash should be gentle — you're not removing a full day of grime, just overnight oil and sweat. A natural soap bar like our Lavender Oat or Sea Moss & Aloe cleanses without stripping your skin's natural moisture barrier.</p>

<h3>3. Apply Products on Damp Skin</h3>
<p>This was a game-changer for me. Applying your serum or moisturizer on slightly damp skin helps lock in extra hydration. The water acts as a vehicle, helping active ingredients penetrate more effectively.</p>

<h3>4. Never Skip SPF</h3>
<p>Rain or shine, winter or summer — sunscreen is non-negotiable. UV damage is the number one cause of premature aging, dark spots, and uneven skin tone. Find a mineral sunscreen that works under your makeup and make it your last step every single morning.</p>

<h3>5. Be Consistent, Not Perfect</h3>
<p>The best skincare routine is the one you'll actually stick to. You don't need 12 products and 45 minutes. A simple cleanse-moisturize-protect routine done consistently will always outperform an elaborate routine done sporadically.</p>

<p>What morning skincare habits have made the biggest difference for you? Share in the comments below!</p>`,
    excerpt: 'Transform your skin with these 5 simple morning habits. From hydration hacks to the sunscreen rule you should never break, these small changes deliver real results.',
    coverImage: '/assets/img/blog/morning_skincare_routine_1772477484772.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['skincare routine', 'morning routine', 'tips', 'wellness'],
    category: 'Tips & Tricks',
    isPublished: true,
    publishedAt: new Date('2025-12-15'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 42,
    isDeleted: false
  },
  {
    id: uuidv4(),
    title: 'The Truth About "Clean Beauty" Labels',
    slug: 'the-truth-about-clean-beauty-labels-' + uuidv4().slice(0, 8),
    content: `<h2>Not All "Natural" Products Are Created Equal</h2>
<p>Walk down any beauty aisle and you'll see it everywhere: "clean," "natural," "organic," "non-toxic." These words feel reassuring, but here's the uncomfortable truth — in the beauty industry, most of these terms are completely unregulated. Let's break down what they actually mean and how to shop smarter.</p>

<h3>The Regulation Gap</h3>
<p>Unlike food labels, the FDA doesn't regulate terms like "natural" or "clean" in cosmetics. A product can slap "natural" on its label while still containing synthetic fragrances, parabens, and petroleum-derived ingredients. The word means whatever the brand wants it to mean.</p>

<h3>Ingredients Lists Don't Lie</h3>
<p>Forget the marketing on the front of the bottle. Flip it over and read the ingredients list. Ingredients are listed in descending order of concentration. If "water" and "fragrance" are in the top five but the hero botanical ingredient is near the bottom, that's a red flag.</p>

<h3>What to Watch Out For</h3>
<p>Here are some common ingredients worth avoiding:</p>
<ul>
<li><strong>Fragrance/Parfum</strong> — A catch-all term that can hide hundreds of undisclosed chemicals</li>
<li><strong>Parabens</strong> — Synthetic preservatives linked to hormone disruption</li>
<li><strong>Sulfates (SLS/SLES)</strong> — Harsh cleansing agents that strip natural oils</li>
<li><strong>Phthalates</strong> — Plasticizers often hidden under "fragrance"</li>
</ul>

<h3>Our Commitment at Sister's Promise</h3>
<p>We believe in full transparency. Every ingredient in our products is listed on our website, and we're happy to explain what each one does and why it's there. Our formulations use organic butters, cold-pressed oils, essential oils for scent, and plant-based colorants. No hidden chemicals, no misleading labels — just honest skincare.</p>

<p>Have questions about specific ingredients? Drop them in the comments and we'll address them in our next post!</p>`,
    excerpt: 'Terms like "clean" and "natural" are unregulated in beauty. Learn how to read ingredient labels, spot red flags, and find products that are genuinely good for your skin.',
    coverImage: '/assets/img/blog/clean_beauty_ingredients_1772477504751.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['clean beauty', 'ingredients', 'education', 'transparency'],
    category: 'Education',
    isPublished: true,
    publishedAt: new Date('2026-01-10'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 36,
    isDeleted: false
  },
  {
    id: uuidv4(),
    title: 'How Our Community Inspires Every Product We Make',
    slug: 'how-our-community-inspires-every-product-we-make-' + uuidv4().slice(0, 8),
    content: `<h2>From Your Feedback to Our Formulations</h2>
<p>Sister's Promise started in a small kitchen with a big dream: to create skincare products that are as honest as the people who use them. But the real magic behind our brand isn't in any single ingredient — it's in our community.</p>

<h3>Listening Is Our Secret Ingredient</h3>
<p>Every product in our collection started with a conversation. Our Shea Butter Moisturizer? That came from dozens of customers telling us they couldn't find a rich moisturizer that didn't feel greasy. Our Turmeric Glow Bar? Inspired by a customer who shared her grandmother's turmeric skincare tradition from Trinidad.</p>

<h3>Real People, Real Results</h3>
<p>We don't use airbrushed models or celebrity endorsements. The faces of Sister's Promise are our actual customers — women and men of all ages and skin types who share their honest experiences with our products. Their stories are our greatest marketing tool.</p>

<h3>Building More Than a Brand</h3>
<p>When you buy from Sister's Promise, you're not just purchasing soap or lotion. You're supporting a vision of beauty that centers community, transparency, and self-care as a radical act of self-love. We donate a portion of every sale to women's wellness programs in our local community.</p>

<h3>Join the Conversation</h3>
<p>We're building something special here, and we want you to be part of it. Follow us on social media, share your skincare journey, and don't be shy about telling us what you want to see next. Your voice shapes our future products.</p>

<p>Thank you for being part of the Sister's Promise family. We're just getting started.</p>`,
    excerpt: "Every Sister's Promise product starts with our community. Learn how your feedback, stories, and traditions inspire the honest skincare products we create.",
    coverImage: '/assets/img/blog/community_inspired_beauty_1772477517793.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['community', 'brand story', 'behind the scenes'],
    category: 'Community',
    isPublished: true,
    publishedAt: new Date('2026-02-01'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 18,
    isDeleted: false
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await BlogPost.countDocuments({ isDeleted: false });
    if (existing > 0) {
      console.log(`Found ${existing} existing blog posts. Skipping seed to avoid duplicates.`);
      console.log('To re-seed, first delete existing posts or drop the blogposts collection.');
      await mongoose.disconnect();
      return;
    }

    const result = await BlogPost.insertMany(seedPosts);
    console.log(`Seeded ${result.length} blog posts:`);
    result.forEach(p => console.log(`  - "${p.title}" (slug: ${p.slug})`));

    await mongoose.disconnect();
    console.log('Done. Disconnected from MongoDB.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
