import { useTranslation } from 'react-i18next';
import TopCard from './TopCard';

interface CardItem {
  title: string;
  detail: string;
  indicator: string;
}

function TopCardsModel() {
  const { t } = useTranslation('common');
  
  // Type assertion for the array
  const topCardsDetails = t('topCards', { returnObjects: true }) as CardItem[];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 w-full max-w-7xl mb-10">
      {topCardsDetails.map((item, index) => (
        <TopCard key={`top-card-${index}`} item={item} index={index} />
      ))}
    </div>
  );
}

export default TopCardsModel;
