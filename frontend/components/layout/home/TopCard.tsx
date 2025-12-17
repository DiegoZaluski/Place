import React from 'react';
import { Link } from 'react-router-dom';

function TopCard({ item, index }) {
  const destination = () => {
    switch (item.title) {
      case 'Models':
        return '/models';
      case 'Chat':
        return '/chat';
      case 'Workflows':
        return '/workflows';
      case 'customization':
        return '/custom';
      case 'IDE':
        return '/ide';
      default:
        return '/';
    }
  };
  return (
    <Link to={destination()}>
      <div
        key={`top-card-${index}`}
        className="
                w-72 
                h-96
                bg-p-50
                dark-bg-primary
                rounded-3xl
                px-10
                py-8
                shadow-2xl
                flex flex-col
                justify-between
                transition-all
                duration-300
                hover:scale-[1.02]
                hover:shadow-xl
                cursor-pointer
                "
      >
        <div className="w-full h-auto mb-4">
          <h3
            className="
                        text-2xl
                        font-bold
                        text-n-900
                        dark-text-secondary
                        overflow-hidden
                        whitespace-nowrap
                        text-ellipsis
                        leading-tight
                        font-playfair"
          >
            {item.title}
          </h3>
          <div
            className="
                    w-3/5
                    h-4
                    g-n-700
                    rounded-full
                    mt-2"
          ></div>
        </div>

        <div
          className="
                flex-grow
                rounded-2xl
                mb-4
                p-5
                space-y-2
                flex
                flex-col
                justify-center
                transition-colors
                duration-200"
        >
          <p
            className="
                    dark-text-secondary
                    text-lg
                    font-semibold
                    leading-relaxed"
          >
            {item.detail.split('.')[0]}.
          </p>
          <p
            className="
                    dark-text-secondary
                    text-xs
                    leading-relaxed
                    mt-1"
          >
            {item.detail.split('.')[1] ? item.detail.split('.')[1].trim() : ''}
          </p>
          <p
            className="
                    dark-text-secondary
                    text-xs
                    font-medium
                    mt-auto
                    border-t
                    dark-border-primary
                    pt-1
                    leading-relaxed"
          >
            {item.indicator}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default TopCard;
