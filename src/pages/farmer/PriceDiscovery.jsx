import React from 'react';
import { useTranslation } from 'react-i18next';
import PriceChecker from '../../components/PriceChecker';

export default function PriceDiscovery() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">{t('priceDiscovery.title')}</h1>
        <p className="text-gray-600">{t('priceDiscovery.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceChecker />
        </div>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">💡 {t('priceDiscovery.sellingTips')}</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
              <li>{t('priceDiscovery.tip1')}</li>
              <li>{t('priceDiscovery.tip2')}</li>
              <li>{t('priceDiscovery.tip3')}</li>
              <li>{t('priceDiscovery.tip4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
