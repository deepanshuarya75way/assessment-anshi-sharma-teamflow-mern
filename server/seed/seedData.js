const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

const seedData = async () => {
  console.log(' Seeding initial demo data...');

  // 1. Create Users
  const admin = await User.create({
    name: 'Alex Rivera',
    email: 'admin@teamflow.io',
    password: 'Admin@123',
    role: 'admin',
    department: 'Engineering Leadership',
    avatar: 'AR',
  });

  const manager = await User.create({
    name: 'Sarah Chen',
    email: 'manager@teamflow.io',
    password: 'Manager@123',
    role: 'manager',
    department: 'Product Management',
    avatar: 'SC',
  });

  const member1 = await User.create({
    name: 'David Miller',
    email: 'member@teamflow.io',
    password: 'Member@123',
    role: 'member',
    department: 'Frontend Engineering',
    avatar: 'DM',
  });

  const member2 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@teamflow.io',
    password: 'Member@123',
    role: 'member',
    department: 'Backend Infrastructure',
    avatar: 'PS',
  });

  console.log(' Seeded 4 team members with roles: Admin, Manager, Members');

  // 2. Create Project 1: FinTech Payment Gateway
  const today = new Date();
  const deadline1 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead
  const deadline2 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

  const project1 = await Project.create({
    name: 'FinTech Payment Gateway v2',
    description: 'High-throughput payment orchestration engine with instant UPI, Stripe 3DS, and idempotent webhooks.',
    key: 'PAY',
    status: 'active',
    priority: 'urgent',
    color: '#6366f1',
    owner: manager._id,
    members: [admin._id, manager._id, member1._id, member2._id],
    deadline: deadline1,
  });

  // Project 2: AI Customer Assistant
  const project2 = await Project.create({
    name: 'AI Customer Assistant Engine',
    description: 'RAG-driven generative customer intelligence bot supporting dynamic semantic document retrieval.',
    key: 'AICA',
    status: 'active',
    priority: 'high',
    color: '#10b981',
    owner: admin._id,
    members: [admin._id, manager._id, member1._id],
    deadline: deadline2,
  });

  console.log(' Seeded 2 production projects');

  // 3. Create Tasks for Project 1
  const overdueDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const upcomingDate1 = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const upcomingDate2 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tasksData = [
    {
      title: 'Implement Webhook Idempotency & Deduplication',
      description: 'Add Redis key leasing with SHA256 payload hashing to prevent double-charging on duplicate webhooks.',
      project: project1._id,
      status: 'in-progress',
      priority: 'urgent',
      assignee: member2._id,
      creator: manager._id,
      dueDate: upcomingDate1,
      tags: ['Backend', 'Security', 'Redis'],
      order: 0,
      comments: [
        {
          user: manager._id,
          text: 'Make sure we store event IDs with a 24-hour TTL.',
          createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        },
        {
          user: member2._id,
          text: 'Unit tests passed for concurrent webhook hits. Benchmarking throughput now.',
          createdAt: new Date(today.getTime() - 6 * 60 * 60 * 1000),
        },
      ],
    },
    {
      title: 'Stripe 3D Secure 2.0 Auth Flow Integration',
      description: 'Upgrade frontend Stripe Elements to support friction-free SCA compliance for European cards.',
      project: project1._id,
      status: 'done',
      priority: 'high',
      assignee: member1._id,
      creator: manager._id,
      dueDate: today,
      tags: ['Frontend', 'Stripe', 'Compliance'],
      order: 0,
      comments: [
        {
          user: member1._id,
          text: 'Verified in Stripe test sandbox with dummy SCA challenge card.',
          createdAt: new Date(today.getTime() - 48 * 60 * 60 * 1000),
        },
      ],
    },
    {
      title: 'Design Unified Checkout Modal with Framer Motion',
      description: 'Smooth glassmorphism checkout experience with card brand auto-detection and instant validation.',
      project: project1._id,
      status: 'in-review',
      priority: 'medium',
      assignee: member1._id,
      creator: manager._id,
      dueDate: upcomingDate1,
      tags: ['Frontend', 'UI/UX', 'Tailwind'],
      order: 0,
      comments: [],
    },
    {
      title: 'Resolve Stale Connection Pooling on Replica Set',
      description: 'Investigate socket timeouts observed in high-concurrency stress test runs on Mongo Atlas.',
      project: project1._id,
      status: 'todo',
      priority: 'urgent',
      assignee: member2._id,
      creator: admin._id,
      dueDate: overdueDate, // Overdue task to highlight dashboard warning!
      tags: ['DevOps', 'MongoDB', 'Bug'],
      order: 0,
      comments: [],
    },
    {
      title: 'Automated Daily Transaction Reconciliation Worker',
      description: 'Background cron job to cross-verify gateway ledger against bank settlement reports.',
      project: project1._id,
      status: 'todo',
      priority: 'high',
      assignee: member2._id,
      creator: manager._id,
      dueDate: upcomingDate2,
      tags: ['Cron', 'Finance', 'Auditing'],
      order: 1,
      comments: [],
    },
    {
      title: 'Security Compliance Audit (OWASP Top 10 API)',
      description: 'Audit rate limits, CORS policies, JWT signature expiry, and SQL/NoSQL injection vectors.',
      project: project1._id,
      status: 'done',
      priority: 'high',
      assignee: admin._id,
      creator: admin._id,
      dueDate: today,
      tags: ['Security', 'Audit'],
      order: 1,
      comments: [],
    },
  ];

  await Task.insertMany(tasksData);
  console.log(` Seeded ${tasksData.length} tasks for Project 1`);

  // Seed activities
  await Activity.create([
    {
      project: project1._id,
      user: manager._id,
      action: 'created_project',
      details: 'Sarah Chen created project "FinTech Payment Gateway v2"',
    },
    {
      project: project1._id,
      user: member1._id,
      action: 'moved_task',
      details: 'David Miller moved "Stripe 3D Secure 2.0 Auth Flow Integration" to DONE',
    },
    {
      project: project1._id,
      user: member2._id,
      action: 'moved_task',
      details: 'Priya Sharma moved "Implement Webhook Idempotency & Deduplication" to IN PROGRESS',
    },
    {
      project: project1._id,
      user: manager._id,
      action: 'commented',
      details: 'Sarah Chen commented on "Implement Webhook Idempotency & Deduplication"',
    },
  ]);

  // Project 2 Tasks
  const p2Tasks = [
    {
      title: 'Setup Pinecone Vector Database Indexing',
      description: 'Index customer support documentation embeddings using OpenAI text-embedding-3-small.',
      project: project2._id,
      status: 'in-progress',
      priority: 'high',
      assignee: admin._id,
      creator: admin._id,
      dueDate: upcomingDate1,
      tags: ['AI/ML', 'VectorDB', 'Embeddings'],
      order: 0,
    },
    {
      title: 'Streaming Chat UI with Markdown Rendering',
      description: 'Implement server-sent events (SSE) chat component with syntax highlighting and prompt suggestions.',
      project: project2._id,
      status: 'done',
      priority: 'medium',
      assignee: member1._id,
      creator: admin._id,
      dueDate: today,
      tags: ['React', 'Frontend', 'Streaming'],
      order: 0,
    },
    {
      title: 'Hallucination Guardrails & Confidence Scoring',
      description: 'Implement output validation threshold; route queries below 0.75 confidence to human agent.',
      project: project2._id,
      status: 'todo',
      priority: 'urgent',
      assignee: manager._id,
      creator: admin._id,
      dueDate: upcomingDate2,
      tags: ['AI Safety', 'Guardrails'],
      order: 0,
    },
  ];

  await Task.insertMany(p2Tasks);
  console.log(' Demo data seeding complete successfully!');
};

// Auto seed helper
const seedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Database is empty. Populating comprehensive demo dataset...');
    await seedData();
  }
};

module.exports = { seedData, seedIfEmpty };

// Run standalone if invoked directly
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    await seedData();
    await disconnectDB();
    process.exit(0);
  })();
}
