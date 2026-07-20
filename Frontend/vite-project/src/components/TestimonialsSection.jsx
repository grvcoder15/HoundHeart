import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Testimonial data
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Anastasia',
    location: 'Oregon',
    featured: true,
    hasRating: true,
    quote: [
      `I spent years researching nervous system regulation while living with CPTSD, fibromyalgia, and chronic fatigue syndrome. I was amazed by how closely HoundHeart aligns with what I have learned through experience. My first dog taught me years ago that our nervous systems co-regulate, long before I knew there was a scientific term for it.`,
      `One day I noticed that whenever I calmed myself through breathing, my dog would immediately relax as well. Over time, she became my earliest indicator that I was becoming stressed, often before I noticed it myself. Since then, I have experienced the same connection with my other pets.`,
      `After only a few days of practicing the HoundHeart exercises, all of us felt more relaxed, connected, and in tune. I slept deeply, woke fully rested and calm, and experienced a level of relaxation that is extremely rare for me. Thank you for that.`,
      `I am very impressed with how HoundHeart explains these subtle, almost mystical experiences with solid science. It brings together nervous system regulation, co-regulation, and practical daily exercises in a way that is easy to understand and apply.`,
      `You are doing important work. HoundHeart has renewed my commitment to making these practices part of my daily life, and I'm excited to become part of the HoundHeart community.`,
    ],
  },
  {
    id: 2,
    name: 'Ruthie',
    location: 'California',
    featured: false,
    hasRating: false,
    quote: [
      `My older son and I have been more involved with it. Happily, he is applying the sing song way to talk to the dogs and breathing. I've noticed much softer tone and the affection my son receives from all three dogs. They trust him more, but not yet so cuddly but he is getting some leans and eye contact.`,
      `The younger kids are seeing the better difference in Domino's barking. As a result of our mindfulness, softer tone and being quiet, Tuck is responding more to their commands and Domino is barking less.`,
      `Still reading. The dogs have made it through a basement renovation and we are keeping their activity a priority.`,
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Decorative Elements
// ─────────────────────────────────────────────────────────────────────────────
const QuoteMark = ({ size = 48, color = '#7c3aed', opacity = 0.15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <text
      x="0"
      y="44"
      fontSize="72"
      fontFamily="Georgia, serif"
      fill={color}
      fillOpacity={opacity}
    >
      "
    </text>
  </svg>
);

const Stars = () => (
  <div className="flex gap-1 mb-6" aria-label="5 out of 5 stars">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className="w-5 h-5 text-amber-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Featured Card
// ─────────────────────────────────────────────────────────────────────────────
const FeaturedCard = ({ testimonial }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleParagraphs = expanded ? testimonial.quote : testimonial.quote.slice(0, 2);
  const hasMore = testimonial.quote.length > 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="relative w-full max-w-4xl mx-auto mb-16"
    >
      {/* Featured Ribbon */}
      <div className="absolute -top-4 -left-4 sm:-left-6 z-10">
        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-sm tracking-wide uppercase px-6 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2 transform -rotate-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Featured Story
        </div>
      </div>

      <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden group">
        {/* Animated Gradient Glow Border effect via pseudo element */}
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400 via-purple-500 to-indigo-500 opacity-20 p-[2px] rounded-[2rem]">
          <div className="absolute inset-0 bg-white rounded-[2rem]"></div>
        </div>

        {/* Content Container */}
        <div className="relative p-8 sm:p-14 z-10">
          <QuoteMark size={140} color="#c084fc" opacity={0.1} className="absolute -top-6 -right-6 transform rotate-12" />

          {testimonial.hasRating && <Stars />}

          {/* Quote Text */}
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {visibleParagraphs.map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-800 leading-relaxed text-[1.15rem] font-medium"
                >
                  {i === 0 && <span className="text-purple-500 text-2xl font-bold font-serif mr-1">"</span>}
                  {para}
                  {(!hasMore || expanded) && i === testimonial.quote.length - 1 && (
                    <span className="text-purple-500 text-2xl font-bold font-serif ml-1">"</span>
                  )}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {/* Read More Toggle */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-6 flex items-center gap-1.5 text-purple-600 font-bold hover:text-fuchsia-600 transition-colors group/btn"
            >
              {expanded ? 'Read less' : 'Read full story'}
              <svg 
                className={`w-4 h-4 transform transition-transform duration-300 ${expanded ? 'rotate-180' : 'group-hover/btn:translate-y-0.5'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          <hr className="my-8 border-purple-100" />

          {/* Author */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
              <span className="text-white font-bold text-2xl">{testimonial.name[0]}</span>
            </div>
            <div>
              <p className="font-extrabold text-gray-900 text-xl">{testimonial.name}</p>
              <p className="text-purple-600 font-semibold">{testimonial.location}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Regular Card
// ─────────────────────────────────────────────────────────────────────────────
const RegularCard = ({ testimonial, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, ease: 'easeOut', delay }}
    className="relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100/50 p-6 sm:p-8 flex flex-col max-w-2xl mx-auto w-full"
  >
    {testimonial.hasRating && <Stars />}

    <div className="space-y-4 flex-1">
      {testimonial.quote.map((para, i) => (
        <p key={i} className="text-gray-600 leading-relaxed text-[0.95rem]">
          {i === 0 && <span className="text-purple-400 font-serif text-lg mr-1 italic">"</span>}
          {para}
          {i === testimonial.quote.length - 1 && (
            <span className="text-purple-400 font-serif text-lg ml-1 italic">"</span>
          )}
        </p>
      ))}
    </div>

    {/* Author */}
    <div className="mt-8 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-600 font-bold text-sm">{testimonial.name[0]}</span>
      </div>
      <div>
        <p className="font-bold text-gray-800 text-sm">{testimonial.name}</p>
        <p className="text-gray-500 text-xs font-medium">{testimonial.location}</p>
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main exported section
// ─────────────────────────────────────────────────────────────────────────────
const TestimonialsSection = () => {
  const featured = TESTIMONIALS.find((t) => t.featured);
  const regular = TESTIMONIALS.filter((t) => !t.featured);

  return (
    <section
      id="testimonials"
      className="relative py-20 sm:py-32 overflow-hidden bg-gray-50"
    >
      {/* Background blobs for visual interest */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/40 mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-pink-200/40 mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-indigo-200/40 mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-24"
        >
          <span className="inline-flex items-center gap-2 bg-purple-100/80 backdrop-blur text-purple-700 text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6 border border-purple-200">
            Beta Tester Testimonials
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            What Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">
              Community
            </span>{' '}
            Says
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Real experiences from people who have discovered the healing power of the human–dog bond.
          </p>
        </motion.div>

        {/* Featured Card */}
        {featured && <FeaturedCard testimonial={featured} />}

        {/* Regular Cards Grid */}
        {regular.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {regular.map((t, i) => (
              <RegularCard key={t.id} testimonial={t} delay={i * 0.15} />
            ))}
          </div>
        )}

        {/* Bottom trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center text-gray-400 text-sm mt-16 font-medium"
        >
          💜 All testimonials are from real HoundHeart members who shared their experiences voluntarily.
        </motion.p>
      </div>
    </section>
  );
};

export default TestimonialsSection;
