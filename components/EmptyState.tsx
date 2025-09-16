import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  onSetupDegree: () => void;
}

export function EmptyState({ onSetupDegree }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-12">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Welcome to UniPlan!</h2>
          <p className="text-muted-foreground mb-6">
            Start planning your university journey by setting up your degree program.
          </p>
          <Button onClick={onSetupDegree} size="lg">
            <GraduationCap className="h-5 w-5 mr-2" />
            Set Up My Degree
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}