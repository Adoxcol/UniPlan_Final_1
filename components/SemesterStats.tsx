'use client';

interface SemesterStatsProps {
  completedCredits: number;
  totalCredits: number;
}

export function SemesterStats({ completedCredits, totalCredits }: SemesterStatsProps) {
  if (totalCredits === 0) return null;

  return (
    <div className="text-sm text-muted-foreground">
      {completedCredits}/{totalCredits} credits completed
    </div>
  );
}