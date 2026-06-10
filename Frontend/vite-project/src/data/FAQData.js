// Shared FAQ data for HoundHeart application
// This data is used in both the user Help Center and Admin FAQ Management

export const faqData = [
    {
        id: 1,
        question: 'How do I sync my wearable device with HoundHeart™?',
        answer: 'Go to Settings > Wearable Integration and follow the step-by-step setup guide for your specific device. We support most major fitness trackers and smartwatches.',
        category: 'Account',
        status: 'published',
        createdAt: '2024-02-15',
        order: 1
    },
    {
        id: 2,
        question: 'What is the Bonded Score™ and how is it calculated?',
        answer: 'The Bonded Score™ measures your energetic alignment with your dog using biometric data, activity patterns, and mindfulness practices. It\'s calculated based on synchronized heart rates, shared activities, and meditation sessions.',
        category: 'Features',
        status: 'published',
        createdAt: '2024-02-14',
        order: 2
    },
    {
        id: 3,
        question: 'Can I use HoundHeart™ with multiple dogs?',
        answer: 'Yes! Premium+ subscribers can track multiple dogs in their household. Each dog gets their own profile and individual Bonded Score™ tracking.',
        category: 'Subscription',
        status: 'published',
        createdAt: '2024-02-13',
        order: 3
    },
    {
        id: 4,
        question: 'Is my data secure and private?',
        answer: 'Absolutely. We use enterprise-grade encryption and never sell your personal data. All biometric and wellness information is stored securely and only used to enhance your HoundHeart™ experience.',
        category: 'General',
        status: 'published',
        createdAt: '2024-02-12',
        order: 4
    }
];

export default faqData;
