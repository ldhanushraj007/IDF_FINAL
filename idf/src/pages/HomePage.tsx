import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import Collections from '../components/Collections';
import Shop from '../components/Shop';
import RecommendedForYou from '../components/recommendations/RecommendedForYou';
import TopPicks from '../components/recommendations/TopPicks';
import RecentlyViewed from '../components/recommendations/RecentlyViewed';
import Atelier from '../components/Atelier';
import StatsStrip from '../components/StatsStrip';
import Gallery from '../components/Gallery';
import Reviews from '../components/Reviews';
import Testimonials from '../components/Testimonials';
import Visit from '../components/Visit';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <div className="flex flex-1 w-full">
        {/* Sidebar (Left) */}
        <aside className="grid-line w-12 flex flex-col items-center py-8 relative hidden md:flex shrink-0 border-r border-[#1a1a1a]">
          <div className="font-label-caps text-label-caps vertical-text text-secondary tracking-widest uppercase">THE SHOP</div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-grow flex flex-col min-w-0">
          <Collections />
          <Shop />
          <RecommendedForYou />
          <TopPicks />
          <div className="bg-surface px-5 sm:px-8 pb-10 border-b border-[#1a1a1a]">
            <div className="container-lux">
              <RecentlyViewed />
            </div>
          </div>
          <Atelier />
          <StatsStrip />
          <Gallery />
          <Reviews />
          <Testimonials />
          <Visit />
        </main>
      </div>
    </>
  );
}
