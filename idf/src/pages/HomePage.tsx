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
      <Collections />
      <Shop />
      <RecommendedForYou />
      <TopPicks />
      <div className="bg-night px-5 sm:px-8 pb-10">
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
    </>
  );
}
