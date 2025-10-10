'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, ThumbsUp, MessageCircle, User } from 'lucide-react';

interface VerifiedReview {
  id: string;
  user: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  date: string;
  helpful_count: number;
  images?: string[];
}

interface VerifiedReviewsProps {
  productId: string;
  productName: string;
  reviews: VerifiedReview[];
}

export default function VerifiedReviews({ productId, productName, reviews }: VerifiedReviewsProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [showAll, setShowAll] = useState(false);

  // Calculate average rating
  const averageRating = reviews.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0
  }));

  // Sort reviews based on selected option
 const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'helpful') {
      return b.helpful_count - a.helpful_count;
    } else { // rating
      return b.rating - a.rating;
    }
 });

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Verified Reviews
        </CardTitle>
        <CardDescription>
          {reviews.length} verified purchase reviews for {productName}
        </CardDescription>
        
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">/5</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {reviews.length} reviews
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === 'recent'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setSortBy('helpful')}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === 'helpful'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Most Helpful
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`text-xs px-2 py-1 rounded ${
              sortBy === 'rating'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Highest Rated
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {displayedReviews.length > 0 ? (
            displayedReviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="bg-muted rounded-full p-2 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{review.user}</h4>
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h5 className="font-medium mt-2">{review.title}</h5>
                    <p className="text-sm mt-1">{review.comment}</p>
                    
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.slice(0, 3).map((image, idx) => (
                          <div key={idx} className="w-16 h-16 bg-muted rounded overflow-hidden">
                            <img 
                              src={image} 
                              alt={`Review image ${idx+1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {review.images.length > 3 && (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs">
                            +{review.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-foreground">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{review.helpful_count} found helpful</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-foreground">
                        <MessageCircle className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No verified reviews yet. Be the first to review this product!
            </p>
          )}
          
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-center text-sm text-primary hover:underline"
            >
              {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}