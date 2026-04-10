import SwiperHome from "../components/Home/Swiper";
import SearchBar from "../components/Home/SearchBar";
import AllProducts from '../components/Home/AllProducts'
import ProductDetailsPage from "./ProductDetailsPage";
import ProfessionalBg from "../components/layout/ProfessionalBg";


const Home = () => {
  return (
    <div>
      
      
    <SwiperHome/>
      <SearchBar/>
      <AllProducts/> 
     
    </div>
  );
};

export default Home;
