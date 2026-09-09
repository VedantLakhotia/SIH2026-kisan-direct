import React from 'react';

const GovtFooter = () => {
  return (
    <footer className="bg-[#003366] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-bold mb-2 text-[#FF9933]">KisanDirect Portal</h4>
            <p className="text-gray-300">An initiative for direct Farm-to-Consumer trade empowering Indian farmers.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-[#FF9933]">Quick Links</h4>
            <ul className="space-y-1 text-gray-300">
              <li><a href="#" className="hover:text-white hover:underline">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Accessibility Statement</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Sitemap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2 text-[#FF9933]">Contact</h4>
            <p className="text-gray-300">Helpline: 1800-XXX-XXXX (Toll Free)</p>
            <p className="text-gray-300">Email: support@kisandirect.gov.in</p>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-4 pt-4 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} KisanDirect Portal | Ministry of Agriculture & Farmers Welfare, Government of India</p>
          <p className="mt-1">Last Updated: {new Date().toLocaleDateString('en-IN')} | Designed & Developed by National Informatics Centre (NIC)</p>
        </div>
      </div>
    </footer>
  );
};

export default GovtFooter;