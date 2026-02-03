import { AdaptiveQuiz } from "@/components/tambo/AdaptiveQuiz";
import { DroidCodeLab } from "@/components/tambo/DroidCodeLab";
import { GalaxyModule } from "@/components/tambo/GalaxyModule";
import { TamboChat } from "@/components/tambo/TamboChat";
import { Badge } from "@/components/ui/badge";
import { TAMBO_PUBLIC_API_KEY } from "@/config/env";

const demoQuiz = [
  {
    id: "q1",
    prompt: "Which HTML element is used to create a hyperlink?",
    options: ["<a>", "<link>", "<href>", "<nav>"],
    correctOption: "<a>",
  },
  {
    id: "q2",
    prompt: "What does CSS stand for?",
    options: [
      "Cascading Style Sheets",
      "Creative Styling System",
      "Computer Style Syntax",
      "Cascaded Script Source",
    ],
    correctOption: "Cascading Style Sheets",
  },
  {
    id: "q3",
    prompt: "Which HTTP method is typically used to create a resource?",
    options: ["GET", "POST", "PUT", "DELETE"],
    correctOption: "POST",
  },
];

const demoMilestones = [
  { name: "Tatooine", completed: true },
  { name: "Naboo", completed: true },
  { name: "Hoth", completed: false },
  { name: "Dagobah", completed: false },
];

export default function Home() {
  const tamboEnabled = Boolean(TAMBO_PUBLIC_API_KEY);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-emerald-50">
            Holocron Academy
          </h1>
          <Badge variant="outline" className="border-emerald-500/40">
            Next.js 14
          </Badge>
          <Badge variant="outline" className="border-emerald-500/40">
            Tambo Generative UI
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-emerald-100/70">
          A hackathon starter focused on adaptive learning modules and a “Galactic
          Terminal” CRT theme.
        </p>
      </div>

      {!tamboEnabled ? (
        <div className="mt-8 rounded-md border border-emerald-500/25 bg-background/10 p-4 text-sm text-emerald-100/80">
          Set <code className="text-emerald-50">NEXT_PUBLIC_TAMBO_API_KEY</code> to
          enable the Tambo console.
        </div>
      ) : null}

      <div className="mt-10 grid gap-8">
        {tamboEnabled ? <TamboChat /> : null}

        <div className="grid gap-8 md:grid-cols-2">
          <AdaptiveQuiz
            title="AdaptiveQuiz (demo)"
            questions={demoQuiz}
            passThreshold={60}
          />
          <GalaxyModule title="GalaxyModule (demo)" milestones={demoMilestones} />
        </div>

        <DroidCodeLab title="DroidCodeLab (demo)" />
      </div>
    </main>
  );
}
