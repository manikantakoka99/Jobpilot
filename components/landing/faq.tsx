import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Is JobPilot AI free to use?",
    answer:
      "Yes. JobPilot AI is built to run entirely on free tiers, so you can create an account and start organizing your job search at no cost.",
  },
  {
    question: "Do I need to connect my LinkedIn account?",
    answer:
      "No. You can add your LinkedIn profile URL to your profile as a simple link — JobPilot AI doesn't require LinkedIn login or API access.",
  },
  {
    question: "Which AI-powered features are available right now?",
    answer:
      "Today, JobPilot AI provides the account, dashboard, and profile foundation. AI-powered tools like ATS scoring, resume optimization, and interview prep are on the roadmap and will roll out in upcoming phases.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your data is stored in a Supabase Postgres database with Row Level Security enabled, meaning only you can ever read or modify your own profile information.",
  },
  {
    question: "Can I use JobPilot AI on my phone?",
    answer:
      "Yes — the entire app, including the dashboard, is fully responsive and works on desktop, tablet, and mobile.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          Can&apos;t find what you&apos;re looking for? Reach out any time.
        </p>
      </div>

      <Accordion type="single" collapsible className="mt-12 w-full">
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.question} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
