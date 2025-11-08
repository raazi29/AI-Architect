'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Globe, Palette, Home, DollarSign } from 'lucide-react'

interface DesignStyle {
  id: string
  name: string
  country: string
  region: string
  description: string
  keyElements: string[]
  exampleImage: string
  averageCost: string
}

const regionalDesignStyles: DesignStyle[] = [
  {
    id: '1',
    name: 'Scandinavian Minimalist',
    country: 'Sweden',
    region: 'Northern Europe',
    description:
      'Characterized by simplicity, minimalism, and functionality. It often features clean lines, light colors, natural materials like wood, and an emphasis on natural light.',
    keyElements: ['Light wood', 'White walls', 'Minimal decor', 'Functional furniture', 'Natural light'],
    exampleImage: '/placeholder.svg',
    averageCost: '$$',
  },
  {
    id: '2',
    name: 'Bohemian Chic',
    country: 'Global',
    region: 'Various',
    description:
      'A free-spirited aesthetic that mixes cultures and artistic expressions. It features a mix of patterns, textures, and colors, often with vintage furniture, global textiles, and natural elements.',
    keyElements: ['Layered textiles', 'Eclectic furniture', 'Vibrant colors', 'Indoor plants', 'Global patterns'],
    exampleImage: '/placeholder.svg',
    averageCost: '$',
  },
  {
    id: '3',
    name: 'Japanese Zen',
    country: 'Japan',
    region: 'East Asia',
    description:
      'Focuses on tranquility, balance, and harmony with nature. It uses natural materials, simple forms, and a muted color palette to create a calm and contemplative space.',
    keyElements: ['Natural wood', 'Sliding doors', 'Minimalist decor', 'Low furniture', 'Indoor gardens'],
    exampleImage: '/placeholder.svg',
    averageCost: '$$$',
  },
  {
    id: '4',
    name: 'Mediterranean Villa',
    country: 'Italy',
    region: 'Southern Europe',
    description:
      'Inspired by the coastal regions of the Mediterranean, featuring warm earthy tones, terracotta, wrought iron, and natural textures. Emphasizes indoor-outdoor living.',
    keyElements: ['Terracotta tiles', 'Stucco walls', 'Wrought iron', 'Arches', 'Warm color palette'],
    exampleImage: '/placeholder.svg',
    averageCost: '$$',
  },
  {
    id: '5',
    name: 'Industrial Loft',
    country: 'USA',
    region: 'North America',
    description:
      'Draws inspiration from old factories and industrial spaces, characterized by raw and unfinished elements like exposed brick, concrete, metal, and reclaimed wood.',
    keyElements: ['Exposed brick', 'Concrete floors', 'Metal accents', 'Reclaimed wood', 'Open-plan layout'],
    exampleImage: '/placeholder.svg',
    averageCost: '$$',
  },
  {
    id: '6',
    name: 'Indian Traditional',
    country: 'India',
    region: 'South Asia',
    description:
      'Rich in vibrant colors, intricate carvings, and traditional motifs. Features heavy wooden furniture, silk textiles, and decorative elements reflecting cultural heritage.',
    keyElements: ['Dark wood furniture', 'Vibrant colors', 'Intricate carvings', 'Silk textiles', 'Traditional motifs'],
    exampleImage: '/placeholder.svg',
    averageCost: '$$',
  },
  {
    id: '7',
    name: 'French Country',
    country: 'France',
    region: 'Western Europe',
    description:
      'Combines rustic charm with elegant sophistication. Features distressed finishes, natural materials, soft colors, and ornate details inspired by rural French homes.',
    keyElements: ['Distressed wood', 'Toile de Jouy', 'Soft pastels', 'Floral patterns', 'Ornate details'],
    exampleImage: '/placeholder.svg',
    averageCost: '$$$',
  },
]

export default function RegionalDesignStylesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedCost, setSelectedCost] = useState('all')

  const filteredStyles = regionalDesignStyles.filter((style) => {
    const matchesSearch =
      style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.keyElements.some((element) => element.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCountry = selectedCountry === 'all' || style.country === selectedCountry
    const matchesCost = selectedCost === 'all' || style.averageCost === selectedCost

    return matchesSearch && matchesCountry && matchesCost
  })

  const countries = Array.from(new Set(regionalDesignStyles.map((style) => style.country))).sort()
  const costs = Array.from(new Set(regionalDesignStyles.map((style) => style.averageCost))).sort()

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-2xl font-semibold">Regional Design Styles</h1>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Explore Design Styles</CardTitle>
              <CardDescription>Discover interior and building designs from around the world.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by style, element, or description..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCost} onValueChange={setSelectedCost}>
                  <SelectTrigger>
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter by Average Cost" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Costs</SelectItem>
                    {costs.map((cost) => (
                      <SelectItem key={cost} value={cost}>
                        {cost}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStyles.length > 0 ? (
                  filteredStyles.map((style) => (
                    <Card key={style.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                      <img
                        src={style.exampleImage}
                        alt={style.name}
                        width={400}
                        height={225}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{style.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Home className="h-3 w-3" /> {style.country}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <p className="line-clamp-3 mb-2">{style.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {style.keyElements.map((element, index) => (
                            <span key={index} className="bg-muted px-2 py-0.5 rounded-full text-xs">
                              {element}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{style.averageCost}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <Palette className="h-4 w-4 mr-2" /> View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No design styles found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}