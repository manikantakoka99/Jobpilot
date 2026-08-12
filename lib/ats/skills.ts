import type { SkillCategory, SkillDefinition } from "./types";
import { containsPhrase, normalizeForMatch } from "./normalize";

/**
 * Curated skill/keyword dictionary used for skills-gap matching.
 *
 * Deliberately kept small and flat (not an exhaustive taxonomy) so it stays
 * easy to scan and extend — add a new `{ name, category, variants }` entry
 * to grow coverage. `variants` should be lowercase surface forms only; the
 * canonical `name` is added automatically.
 */
const SKILL_DEFS: { name: string; category: SkillCategory; variants?: string[] }[] = [
  // Programming languages
  { name: "JavaScript", category: "programming", variants: ["js"] },
  { name: "TypeScript", category: "programming", variants: ["ts"] },
  { name: "Python", category: "programming" },
  { name: "Java", category: "programming" },
  { name: "C++", category: "programming", variants: ["cpp"] },
  { name: "C#", category: "programming", variants: ["csharp", "c sharp"] },
  { name: "Go", category: "programming", variants: ["golang"] },
  { name: "Rust", category: "programming" },
  { name: "PHP", category: "programming" },
  { name: "Ruby", category: "programming" },
  { name: "Swift", category: "programming" },
  { name: "Kotlin", category: "programming" },
  { name: "SQL", category: "programming" },
  { name: "Bash", category: "programming", variants: ["shell scripting"] },

  // Frameworks / libraries
  { name: "React", category: "frameworks", variants: ["react.js", "reactjs"] },
  { name: "Next.js", category: "frameworks", variants: ["nextjs"] },
  { name: "Vue", category: "frameworks", variants: ["vue.js", "vuejs"] },
  { name: "Angular", category: "frameworks" },
  { name: "Node.js", category: "frameworks", variants: ["nodejs", "node js"] },
  { name: "Express", category: "frameworks", variants: ["express.js", "expressjs"] },
  { name: "Django", category: "frameworks" },
  { name: "Flask", category: "frameworks" },
  { name: "Spring Boot", category: "frameworks", variants: ["spring"] },
  { name: "Ruby on Rails", category: "frameworks", variants: ["rails"] },
  { name: ".NET", category: "frameworks", variants: ["dotnet", "asp.net"] },
  { name: "Tailwind CSS", category: "frameworks", variants: ["tailwind"] },

  // Cloud platforms
  { name: "AWS", category: "cloud", variants: ["amazon web services"] },
  { name: "Azure", category: "cloud", variants: ["microsoft azure"] },
  { name: "Google Cloud", category: "cloud", variants: ["gcp", "google cloud platform"] },
  { name: "Vercel", category: "cloud" },
  { name: "Heroku", category: "cloud" },
  { name: "Firebase", category: "cloud" },

  // Databases
  { name: "PostgreSQL", category: "databases", variants: ["postgres"] },
  { name: "MySQL", category: "databases" },
  { name: "MongoDB", category: "databases", variants: ["mongo"] },
  { name: "Redis", category: "databases" },
  { name: "SQLite", category: "databases" },
  { name: "Supabase", category: "databases" },
  { name: "DynamoDB", category: "databases" },
  { name: "Elasticsearch", category: "databases" },

  // DevOps
  { name: "Docker", category: "devops" },
  { name: "Kubernetes", category: "devops", variants: ["k8s"] },
  { name: "CI/CD", category: "devops", variants: ["ci cd", "cicd", "continuous integration", "continuous deployment"] },
  { name: "Terraform", category: "devops" },
  { name: "Jenkins", category: "devops" },
  { name: "GitHub Actions", category: "devops" },
  { name: "Ansible", category: "devops" },
  { name: "Linux", category: "devops" },
  { name: "Git", category: "devops" },

  // Cybersecurity
  { name: "Penetration Testing", category: "cybersecurity", variants: ["pen testing", "pentesting"] },
  { name: "Security+", category: "cybersecurity", variants: ["security plus"] },
  { name: "SIEM", category: "cybersecurity" },
  { name: "Vulnerability Assessment", category: "cybersecurity" },
  { name: "Network Security", category: "cybersecurity" },
  { name: "Incident Response", category: "cybersecurity" },
  { name: "Zero Trust", category: "cybersecurity" },

  // Tools
  { name: "Jira", category: "tools" },
  { name: "Figma", category: "tools" },
  { name: "Postman", category: "tools" },
  { name: "Slack", category: "tools" },
  { name: "Confluence", category: "tools" },
  { name: "Agile", category: "tools" },
  { name: "Scrum", category: "tools" },

  // Certifications
  { name: "AWS Certified Solutions Architect", category: "certifications", variants: ["aws solutions architect", "aws certified"] },
  { name: "Azure Administrator", category: "certifications", variants: ["az-104", "azure certified"] },
  { name: "CISSP", category: "certifications" },
  { name: "CISM", category: "certifications" },
  { name: "CCNA", category: "certifications" },
  { name: "CompTIA Security+", category: "certifications", variants: ["comptia security+"] },
  { name: "PMP", category: "certifications", variants: ["project management professional"] },
  { name: "Certified Scrum Master", category: "certifications", variants: ["csm"] },
  { name: "Google Cloud Certified", category: "certifications" },
];

export const SKILLS: SkillDefinition[] = SKILL_DEFS.map((def) => ({
  name: def.name,
  category: def.category,
  variants: Array.from(new Set([def.name.toLowerCase(), ...(def.variants ?? [])])),
}));

export function skillPresentIn(normalizedText: string, skill: SkillDefinition): boolean {
  return skill.variants.some((variant) => containsPhrase(normalizedText, variant));
}

/** Returns every dictionary skill mentioned anywhere in the given (raw, un-normalized) text. */
export function findSkillsIn(text: string): SkillDefinition[] {
  const normalized = normalizeForMatch(text);
  return SKILLS.filter((skill) => skillPresentIn(normalized, skill));
}
