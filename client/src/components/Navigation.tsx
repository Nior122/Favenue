import { Link } from "wouter";

export default function Navigation() {

  return (
    <nav className="bg-black border-b border-green-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">♥</span>
              </div>
              <span className="text-green-400 text-lg sm:text-xl font-bold">CreatorHub</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link href="/">
                <span 
                  className={`text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                    location === "/" ? "text-green-100" : ""
                  }`}
                  data-testid="link-browse"
                >
                  Models
                </span>
              </Link>
              <a href="#" className="text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-categories">
                Categories
              </a>
              <a href="#" className="text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-premium">
                VIP Access
              </a>
              <a href="#" className="text-green-300 hover:text-green-100 px-3 py-2 rounded-md text-sm font-medium transition" data-testid="link-cam">
                Live Shows
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Authentication buttons removed */}
          </div>
        </div>
      </div>
    </nav>
  );
}
