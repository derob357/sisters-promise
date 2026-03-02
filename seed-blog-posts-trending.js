/**
 * Seed script: 4 trending blog posts based on current skincare industry research
 * Run: node seed-blog-posts-trending.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const BlogPost = require('./models/BlogPost');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters-promise';

const trendingPosts = [
  {
    id: uuidv4(),
    title: 'Turmeric Soap Is Taking Over Skincare — Here\'s What the Science Actually Says',
    slug: 'turmeric-soap-is-taking-over-skincare-heres-what-science-says-' + uuidv4().slice(0, 8),
    content: `<h2>From Ayurvedic Tradition to Your Morning Routine</h2>
<p>Turmeric soap has made the leap from traditional Ayurvedic cleansing rituals into mainstream skincare, showing up in U.S. drugstores, wellness blogs, and viral social media videos. But behind the hype, there's real science worth understanding — and a few things to keep in mind before you swap out your daily bar.</p>

<h3>The Power of Curcumin</h3>
<p>The magic ingredient in turmeric is curcumin, a polyphenol that gives the spice its golden color. Curcumin is a potent antioxidant and anti-inflammatory compound that has been studied extensively for its effects on skin health. A systematic review published in <em>Phytotherapy Research</em> found that curcumin can help neutralize oxidative stress and support the skin's natural defense system — which translates to healthier, more resilient skin over time.</p>

<h3>What Turmeric Soap Can Actually Do</h3>
<p>Based on current dermatological research, turmeric soap shows genuine promise in several areas:</p>
<ul>
<li><strong>Fading dark spots and hyperpigmentation</strong> — Curcumin inhibits melanin production by suppressing tyrosinase activity. With consistent daily use over several weeks, many users report visibly more even skin tone.</li>
<li><strong>Calming acne and inflammation</strong> — The anti-inflammatory properties help reduce redness and swelling associated with breakouts. Turmeric soap is particularly effective for managing mild to moderate acne.</li>
<li><strong>Brightening dull skin</strong> — By neutralizing free radicals and promoting cell turnover, turmeric gives skin a natural glow that builds gradually with regular use.</li>
<li><strong>Soothing sensitive skin</strong> — Unlike harsh chemical brighteners, turmeric works gently, making it suitable for sensitive skin types when formulated correctly.</li>
</ul>

<h3>The Honest Limitations</h3>
<p>Here's what the marketing won't tell you: because turmeric soap is a wash-off product, curcumin's contact time with your skin is limited. The compound doesn't absorb deeply through the skin barrier in the brief window of a face wash. That means dramatic overnight results aren't realistic — consistency over weeks is what delivers visible change.</p>
<p>This is also why formulation matters enormously. A bar made with high-quality turmeric extract, combined with complementary ingredients like nourishing oils and gentle cleansing agents, will outperform a commercial bar with a token sprinkle of turmeric powder.</p>

<h3>How We Formulate Our Turmeric Ginger Latte Soap</h3>
<p>At Sister's Promise, we combine organic turmeric root powder with ginger essential oil and a base of cold-pressed olive oil and coconut oil. The ginger adds its own anti-inflammatory benefits while creating a warm, spice-market aroma. We don't use synthetic fragrances or artificial colorants — that golden hue comes entirely from the turmeric itself.</p>
<p>We recommend using it daily for at least 3-4 weeks to start seeing brightening effects. Let the lather sit on your skin for 30-60 seconds before rinsing to maximize the curcumin's contact time.</p>

<p>Have you tried turmeric in your skincare routine? Share your experience in the comments below!</p>`,
    excerpt: 'Turmeric soap has gone from Ayurvedic tradition to viral skincare trend. Here\'s what curcumin actually does for your skin, what the science says, and what to realistically expect.',
    coverImage: '/assets/img/blog/turmeric_soap_science_1772477569269.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['turmeric', 'curcumin', 'brightening', 'natural skincare', 'trending'],
    category: 'Ingredients',
    isPublished: true,
    publishedAt: new Date('2026-02-05'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 58,
    isDeleted: false
  },
  {
    id: uuidv4(),
    title: 'Sea Moss Has 316 Million Views on TikTok — But Does It Really Work for Skin?',
    slug: 'sea-moss-316-million-views-tiktok-does-it-work-for-skin-' + uuidv4().slice(0, 8),
    content: `<h2>Separating the Hype from the Science</h2>
<p>Sea moss has officially entered the skincare mainstream. With over 316 million views on TikTok, celebrity endorsements, and a projected market of $2.6 billion by 2030, this ocean-derived algae is no longer a niche wellness ingredient — it's a full-blown phenomenon. But what does the research actually tell us about sea moss on your skin?</p>

<h3>What Sea Moss Brings to the Table</h3>
<p>Sea moss (Chondrus crispus), also called Irish moss, is a red algae packed with an impressive nutritional profile. It contains 92 of the 102 minerals our bodies need, including zinc, magnesium, calcium, selenium, and vitamins A, C, E, and K. But the real star for skincare is its high concentration of polysaccharides — specifically carrageenan.</p>

<h3>The Science-Backed Benefits</h3>
<p>Here's what dermatologists and researchers have confirmed about sea moss for skin:</p>
<ul>
<li><strong>Deep hydration without the grease</strong> — Carrageenan forms a breathable gel-like film on the skin that locks in moisture without clogging pores. Unlike many synthetic moisturizers that sit on the surface, sea moss penetrates into the upper layers of skin for lasting hydration.</li>
<li><strong>Antibacterial and anti-inflammatory action</strong> — The high sulfur content gives sea moss natural antibacterial properties. Research shows it can help reduce acne-causing bacteria while calming inflammation and redness.</li>
<li><strong>Oil control for acne-prone skin</strong> — Sulfur in sea moss helps regulate sebum production, reducing the oiliness and congestion that lead to breakouts. This makes it particularly useful for combination and oily skin types.</li>
<li><strong>Antioxidant protection</strong> — Rich in antioxidants, sea moss helps combat free radical damage from UV exposure and environmental pollutants, which contributes to premature aging.</li>
<li><strong>Soothing for eczema and psoriasis</strong> — The anti-inflammatory properties and mineral content can help calm irritated skin conditions, though it should complement rather than replace prescribed treatments.</li>
</ul>

<h3>What Dermatologists Want You to Know</h3>
<p>Board-certified dermatologists note that while sea moss has genuine benefits, the research on topical application is still limited compared to other proven ingredients. Dr. Amy Kassouf from the Cleveland Clinic describes sea moss as "a nice supporting ingredient" — meaning it works best as part of a well-formulated product alongside other proven actives, not as a miracle cure on its own.</p>
<p>The quality of sea moss matters enormously. Wildcrafted sea moss harvested from clean ocean waters has a completely different mineral profile than pool-grown alternatives. If you're buying sea moss products, ask about sourcing.</p>

<h3>Why We Use Wildcrafted Sea Moss</h3>
<p>Our Sea Moss & Aloe Soap uses wildcrafted sea moss gel — not powder, not extract, but the real thing. We combine it with organic aloe vera for an extra layer of hydration and soothing. The result is a bar that cleanses gently while delivering genuine mineral nutrition to your skin with every wash.</p>
<p>We source our sea moss from sustainable harvesters who hand-pick from natural ocean beds, ensuring maximum mineral content and zero pool-grown fillers.</p>

<p>The TikTok hype is real — but for us, sea moss has been an ingredient we've believed in long before it went viral. What questions do you have about sea moss? Drop them in the comments!</p>`,
    excerpt: 'Sea moss has 316 million TikTok views and a $2.6B projected market. Dermatologists weigh in on what this ocean algae actually does for your skin — and what\'s just hype.',
    coverImage: '/assets/img/blog/sea_moss_viral_1772477582884.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['sea moss', 'trending', 'skincare science', 'hydration', 'acne'],
    category: 'Ingredients',
    isPublished: true,
    publishedAt: new Date('2026-02-08'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 87,
    isDeleted: false
  },
  {
    id: uuidv4(),
    title: 'Handmade Soap vs. Commercial Soap: What\'s Actually in Your Bar?',
    slug: 'handmade-soap-vs-commercial-soap-whats-actually-in-your-bar-' + uuidv4().slice(0, 8),
    content: `<h2>The Ingredient List Will Surprise You</h2>
<p>You use soap every single day, but have you ever flipped that bar over and actually read the label? If you're using a commercial "beauty bar" or "body wash," you might be surprised to learn that what you're lathering up with isn't technically soap at all — it's a synthetic detergent. And the difference matters more than you'd think.</p>

<h3>The Glycerin Problem</h3>
<p>Here's something the big soap companies don't advertise: real soap naturally produces glycerin during the saponification process. Glycerin is a humectant — it draws moisture from the air to your skin, leaving it soft and hydrated. It's one of the best natural moisturizing ingredients that exists.</p>
<p>But in commercial soap manufacturing, glycerin is deliberately extracted and sold separately (it's more profitable as an ingredient in lotions and cosmetics). What's left behind is a stripped-down detergent bar that cleans your skin but leaves it dry, tight, and irritated. Then the same company sells you a moisturizer to fix the problem their soap created.</p>
<p>Handmade soap retains all of its natural glycerin. Every single bar.</p>

<h3>Synthetic Detergents vs. Real Soap</h3>
<p>Most commercial "soaps" are actually synthetic detergent bars. Flip over a Dove Beauty Bar and you'll see it's labeled as a "beauty bar," not soap — because legally it can't be called soap. Common synthetic ingredients include:</p>
<ul>
<li><strong>Sodium Lauryl Sulfate (SLS)</strong> — A harsh surfactant that creates lots of lather but strips your skin's natural oils, causing dryness, irritation, and disrupting your skin's moisture barrier.</li>
<li><strong>Parabens (methylparaben, propylparaben)</strong> — Synthetic preservatives that extend shelf life but have been linked to hormone disruption in multiple studies.</li>
<li><strong>Synthetic fragrance (parfum)</strong> — A single word that can hide hundreds of undisclosed chemical compounds, many of which are known skin sensitizers and allergens.</li>
<li><strong>Triclosan</strong> — An antibacterial agent the FDA banned from hand soaps in 2016 but that still appears in some products.</li>
<li><strong>BHT (Butylated Hydroxytoluene)</strong> — A synthetic antioxidant used as a preservative that some research links to endocrine disruption.</li>
</ul>

<h3>What's in a Handmade Bar</h3>
<p>A properly crafted handmade soap has a remarkably simple ingredient list. Our Sister's Promise bars contain variations of:</p>
<ul>
<li>Cold-pressed olive oil or coconut oil (the cleansing base)</li>
<li>Organic shea butter or cocoa butter (for richness and moisture)</li>
<li>Essential oils for scent (lavender, tea tree, lemongrass — never synthetic fragrance)</li>
<li>Natural colorants (turmeric for gold, activated charcoal for black, clays for earth tones)</li>
<li>Specialty ingredients (sea moss gel, oat milk, honey, botanical extracts)</li>
</ul>
<p>That's it. Everything is pronounceable, everything has a purpose, and nothing is hidden behind vague terms.</p>

<h3>The Environmental Angle</h3>
<p>Handmade soaps are biodegradable — they break down naturally without polluting waterways. Commercial soaps containing microbeads, synthetic chemicals, and petroleum derivatives can take decades to break down and have measurable impacts on aquatic ecosystems.</p>
<p>There's also the packaging difference. Most handmade soaps come in minimal, recyclable wrapping. Commercial body washes come in plastic bottles that overwhelmingly end up in landfills.</p>

<h3>The Cost Question</h3>
<p>Yes, a handmade bar costs more upfront — typically $8-15 compared to $1-4 for a commercial bar. But consider this: a well-made bar lasts 4-6 weeks, you won't need a separate moisturizer for dry skin, and you're not paying for the environmental and health costs that cheap soap externalizes. When you factor in what you're NOT putting on your skin, the math changes.</p>

<p>Next time you pick up a bar, flip it over. Read the ingredients. You deserve to know what you're putting on the largest organ in your body.</p>`,
    excerpt: 'Commercial "soap" isn\'t actually soap — it\'s synthetic detergent with the glycerin removed. Here\'s what\'s really in your bar and why handmade soap is worth the switch.',
    coverImage: '/assets/img/blog/handmade_vs_commercial_soap_comparison_1772477598705.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['handmade soap', 'clean beauty', 'ingredients', 'education', 'natural vs synthetic'],
    category: 'Education',
    isPublished: true,
    publishedAt: new Date('2026-02-10'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 45,
    isDeleted: false
  },
  {
    id: uuidv4(),
    title: 'Your Skin Microbiome: The 2026 Skincare Trend That Changes Everything',
    slug: 'your-skin-microbiome-2026-skincare-trend-changes-everything-' + uuidv4().slice(0, 8),
    content: `<h2>Why the Biggest Skincare Shift in a Decade Is About What You Stop Doing</h2>
<p>Every few years, the skincare industry latches onto a trend that actually changes how we think about skin health. In 2026, that trend is the skin microbiome — and unlike past fads, this one is backed by serious science. The shift is simple but radical: instead of stripping, scrubbing, and layering your skin into submission, the new approach is about protecting the invisible ecosystem that keeps your skin healthy in the first place.</p>

<h3>What Is Your Skin Microbiome?</h3>
<p>Your skin is home to trillions of microorganisms — bacteria, fungi, and viruses — that form a living community called the microbiome. Far from being something to scrub away, this ecosystem is your skin's first line of defense. A balanced microbiome:</p>
<ul>
<li>Fights off harmful pathogens that cause infections and breakouts</li>
<li>Regulates inflammation, reducing redness and sensitivity</li>
<li>Produces natural lipids that keep your skin barrier strong and hydrated</li>
<li>Communicates with your immune system to calibrate its response</li>
</ul>
<p>When your microbiome is disrupted — by harsh cleansers, over-exfoliation, antibacterial products, or environmental stress — your skin loses its natural protection. The result? Increased sensitivity, breakouts, dryness, accelerated aging, and conditions like eczema and rosacea.</p>

<h3>What's Driving the 2026 Shift</h3>
<p>A comprehensive review published in the <em>Annals of Dermatology</em> in 2025 confirmed what researchers had been piecing together: a compromised skin barrier accelerates aging, leading to dehydration, chronic sensitivity, and inflammation. The study found that microbiome-based interventions — including prebiotics, probiotics, and postbiotics — can measurably improve barrier function and reduce signs of aging.</p>
<p>The beauty industry is responding. According to Glimpse trend data, microbiome skincare is one of the top 33 skincare trends of 2026, with brands racing to reformulate around barrier protection rather than aggressive treatment.</p>

<h3>What This Means for Your Routine</h3>
<p>The microbiome-friendly approach doesn't require buying a whole new product lineup. It starts with what you stop doing:</p>
<ol>
<li><strong>Ditch harsh cleansers</strong> — Sulfate-based face washes (SLS, SLES) destroy your microbiome. Switch to gentle, pH-balanced cleansers that clean without stripping. Natural soap made with nourishing oils cleanses effectively while preserving your skin's natural flora.</li>
<li><strong>Stop over-exfoliating</strong> — Daily acids and aggressive scrubs thin the skin barrier and decimate beneficial bacteria. If you exfoliate, limit it to 1-2 times per week.</li>
<li><strong>Rethink "antibacterial" products</strong> — Products designed to kill bacteria don't discriminate between good and bad. The antibacterial soap at your sink is carpet-bombing your microbiome every time you wash.</li>
<li><strong>Try skin cycling</strong> — Instead of using active products every day, rotate treatment days with recovery days. Some days focus on retinol or acids; other days focus on hydration and barrier repair.</li>
<li><strong>Feed your skin</strong> — Prebiotic ingredients (like oat extract, honey, and certain plant fibers) nourish the beneficial bacteria on your skin. Look for products that support rather than disrupt.</li>
</ol>

<h3>Why Natural Soap Is Microbiome-Friendly</h3>
<p>Here's something we've always known intuitively that science is now confirming: handmade, natural soap is inherently gentler on your skin's ecosystem. Our cold-process bars maintain a natural pH, retain glycerin for moisture, and use plant-based oils that don't strip the skin's acid mantle. We never use antibacterial agents, synthetic detergents, or preservatives that disrupt microbial balance.</p>
<p>Ingredients like oat milk, honey, and shea butter — staples in our formulations — are natural prebiotics that feed the good bacteria on your skin. When we formulated these bars, we weren't chasing a trend. We were following the same wisdom that traditional soapmakers have understood for generations: work with your skin, not against it.</p>

<p>The microbiome revolution isn't about buying more products — it's about being smarter with fewer. What changes have you made to protect your skin barrier? Share in the comments!</p>`,
    excerpt: 'The biggest skincare trend of 2026 is the skin microbiome — and it\'s changing everything we thought we knew about cleansing, exfoliation, and what "clean" skin really means.',
    coverImage: '/assets/img/blog/skin_microbiome_science_1772477616840.png',
    author: { userId: 'system', userName: "Sister's Promise", userRole: 'owner' },
    tags: ['microbiome', 'skin barrier', '2026 trends', 'skincare science', 'gentle skincare'],
    category: 'Skincare Science',
    isPublished: true,
    publishedAt: new Date('2026-02-13'),
    isFeatured: true,
    votes: [],
    score: 0,
    comments: [],
    commentCount: 0,
    viewCount: 32,
    isDeleted: false
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await BlogPost.insertMany(trendingPosts);
    console.log(`\nSeeded ${result.length} trending blog posts:`);
    result.forEach(p => console.log(`  - "${p.title}" (${p.publishedAt.toISOString().slice(0, 10)})`));

    await mongoose.disconnect();
    console.log('\nDone. Disconnected from MongoDB.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
