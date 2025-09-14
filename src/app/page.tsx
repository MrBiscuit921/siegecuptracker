import { SiegeCupTweets } from "@/components/siege-cup-tweets"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Rainbow Six Siege Cup Tracker</h1>
          <p className="text-muted-foreground">Latest tweets from @Rainbow6Game about Siege Cup</p>
        </div>
        <SiegeCupTweets />
      </div>
    </main>
  )
}
