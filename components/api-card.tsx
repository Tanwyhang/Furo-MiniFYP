import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Activity } from 'lucide-react';
import { API } from '@/lib/mock-data';
import Link from 'next/link';

interface APICardProps {
  api: API;
}

export function APICard({ api }: APICardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{api.name}</CardTitle>
          <Badge variant="secondary">{api.category}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{api.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">{api.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              {api.totalCalls.toLocaleString()} calls
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-bold">{api.price} {api.currency}</span>
              <span className="text-sm text-muted-foreground ml-1">per call</span>
            </div>
            <Link href={`/api/${api.id}`}>
              <Button size="sm">View Details</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}