"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Palette, 
  Sofa, 
  Lightbulb 
} from "lucide-react"

interface ImageAnalysis {
  room_type: string
  design_style: string
  furniture_objects: string[]
  color_palette: string[]
  improvement_suggestions: string[]
}

interface ImageAnalysisDisplayProps {
  analysis: ImageAnalysis
}

export function ImageAnalysisDisplay({ analysis }: ImageAnalysisDisplayProps) {
  return (
    <Card className="mt-4 w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>Image Analysis Results</span>
        </CardTitle>
        <CardDescription>Detailed insights from your uploaded image</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-full">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">Room Type</h3>
              <Badge variant="secondary" className="text-xs">
                {analysis.room_type || "Not detected"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-full">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">Design Style</h3>
              <Badge variant="secondary" className="text-xs">
                {analysis.design_style || "Not detected"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-full">
              <Sofa className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">Furniture & Objects</h3>
              <div className="flex flex-wrap gap-1">
                {analysis.furniture_objects && analysis.furniture_objects.length > 0 ? (
                  analysis.furniture_objects.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs">None detected</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-full">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">Color Palette</h3>
              <div className="flex flex-wrap gap-1">
                {analysis.color_palette && analysis.color_palette.length > 0 ? (
                  analysis.color_palette.map((color, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {color}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs">Not detected</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/10 rounded-full">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-2">Improvement Suggestions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.improvement_suggestions && analysis.improvement_suggestions.length > 0 ? (
                  analysis.improvement_suggestions.map((suggestion, index) => (
                    <li key={index} className="text-muted-foreground">{suggestion}</li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No suggestions available</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}