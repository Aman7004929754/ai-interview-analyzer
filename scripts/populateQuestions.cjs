const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '..', 'api', '_data', 'questions.json');
let data = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

// Helper to generate a unique ID
function generateId(subjectId, topicStr, index) {
  const shortTopic = topicStr.substring(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${subjectId}-${shortTopic}-gen-${index}-${Math.floor(Math.random()*1000)}`;
}

// Templates for generating questions
const templates = [
  {
    q: "Explain the core principles behind [TOPIC] and why it is critical in [SUBJECT].",
    kw: ["principles", "foundation", "concept", "importance", "system"],
    a: "The core principles of [TOPIC] revolve around efficiently managing resources and data. In the context of [SUBJECT], this ensures optimal performance, security, and scalability. Understanding these fundamentals allows engineers to build robust architectures that can handle edge cases gracefully."
  },
  {
    q: "What are the most common pitfalls or anti-patterns when dealing with [TOPIC]?",
    kw: ["pitfall", "anti-pattern", "mistake", "optimization", "bottleneck"],
    a: "A common pitfall in [TOPIC] is ignoring edge cases and not considering scaling early on. Developers often choose the most straightforward approach which might result in high time/space complexity or resource leaks. Addressing bottlenecks through profiling and adhering to best practices is crucial."
  },
  {
    q: "Compare and contrast different approaches to implementing [TOPIC].",
    kw: ["trade-offs", "compare", "performance", "implementation", "efficiency"],
    a: "Different implementations of [TOPIC] offer various trade-offs. Some prioritize fast read times at the expense of memory, while others focus on minimizing write latency. Choosing the right approach requires analyzing the specific constraints of the system, such as expected throughput, latency requirements, and consistency needs."
  },
  {
    q: "How would you optimize an existing system heavily relying on [TOPIC]?",
    kw: ["optimize", "profiling", "refactoring", "caching", "complexity"],
    a: "Optimization begins with profiling to identify exactly where the bottlenecks in [TOPIC] occur. Once identified, I would look into reducing algorithmic complexity, adding caching layers, parallelizing independent tasks, and potentially redesigning the data structures being used to better fit the access patterns."
  },
  {
    q: "Describe a real-world scenario where a deep understanding of [TOPIC] was necessary to solve a problem.",
    kw: ["real-world", "application", "scenario", "problem-solving", "deployment"],
    a: "In a high-traffic production environment, a system was experiencing intermittent timeouts. By applying deep knowledge of [TOPIC], we identified that a resource lock was causing a cascade of delays. Refactoring the implementation to be lock-free and asynchronous resolved the issue entirely."
  },
  {
    q: "What are the security implications associated with [TOPIC]?",
    kw: ["security", "vulnerability", "protection", "access control", "exploitation"],
    a: "Security in [TOPIC] involves ensuring that resources cannot be hijacked or leaked. Common vulnerabilities include race conditions, buffer overflows, or unauthorized state modifications. Mitigation requires strict input validation, proper access controls, and adhering to the principle of least privilege."
  },
  {
    q: "How does [TOPIC] integrate with modern cloud-native architectures?",
    kw: ["cloud", "microservices", "distributed", "scaling", "stateless"],
    a: "[TOPIC] must often be adapted for distributed environments. In cloud-native systems, state is usually decoupled from processing, meaning that mechanisms related to [TOPIC] must be fault-tolerant and capable of handling network partitions, often utilizing distributed consensus algorithms or message brokers."
  },
  {
    q: "Explain the theoretical limits and algorithmic bounds related to [TOPIC].",
    kw: ["Big O", "bounds", "theoretical", "limitations", "complexity"],
    a: "The theoretical limits of [TOPIC] are defined by physical constraints like memory latency and CPU cycles, often expressed using asymptotic notation (Big O). For instance, certain operations cannot be faster than O(log n) if they rely on comparisons. Acknowledging these bounds helps set realistic performance expectations."
  },
  {
    q: "Walk me through how you would test and validate a complex implementation of [TOPIC].",
    kw: ["testing", "unit test", "integration", "validation", "coverage"],
    a: "Testing [TOPIC] requires a multi-tiered approach. I would start with exhaustive unit tests covering all edge cases and boundary conditions. Then, I would implement integration tests to see how it interacts with other system components, followed by stress/load testing to ensure it behaves correctly under extreme concurrency or data volume."
  },
  {
    q: "What future trends do you see impacting how we handle [TOPIC]?",
    kw: ["future", "trends", "evolution", "hardware", "paradigm"],
    a: "Future trends affecting [TOPIC] include the rise of AI-driven optimizations, quantum computing implications, and increasingly parallel hardware architectures. As systems grow larger, the abstractions we use for [TOPIC] will need to become more declarative, allowing compilers and runtimes to handle low-level optimizations."
  }
];

let addedCount = 0;

Object.entries(data.subjects).forEach(([subjectId, subject]) => {
  // Find all unique topics currently in the subject
  const topicsMap = new Map();
  subject.questions.forEach(q => {
    if (q.topic) {
      if (!topicsMap.has(q.topic)) topicsMap.set(q.topic, []);
      topicsMap.get(q.topic).push(q);
    }
  });

  // For each topic, ensure it has at least 10 questions
  for (const [topicName, existingQs] of topicsMap.entries()) {
    let needed = 10 - existingQs.length;
    
    if (needed > 0) {
      let tplIndex = 0;
      for (let i = 0; i < needed; i++) {
        const template = templates[tplIndex % templates.length];
        
        const newQ = {
          id: generateId(subjectId, topicName, existingQs.length + i),
          question: template.q.replace(/\[TOPIC\]/g, topicName).replace(/\[SUBJECT\]/g, subject.name),
          difficulty: i % 2 === 0 ? 'medium' : (i % 3 === 0 ? 'hard' : 'easy'),
          expectedKeywords: template.kw,
          idealAnswer: template.a.replace(/\[TOPIC\]/g, topicName).replace(/\[SUBJECT\]/g, subject.name),
          followUp: `Can you elaborate more on the advanced aspects of ${topicName}?`,
          topic: topicName
        };
        
        subject.questions.push(newQ);
        addedCount++;
        tplIndex++;
      }
    }
  }
});

fs.writeFileSync(questionsPath, JSON.stringify(data, null, 2));
console.log(`Successfully added ${addedCount} questions to reach the 10-question per topic requirement.`);
