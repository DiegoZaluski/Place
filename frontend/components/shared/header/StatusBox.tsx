import React, { useEffect, useState } from 'react';

// URL: Repository URL for easy modification
const REPOSITORY_URL = 'https://github.com/DiegoZaluski/Place';
const GITHUB_API_URL = 'https://api.github.com/repos/DiegoZaluski/Place';

interface GitHubData {
  stargazers_count: number;
}

function StatusBox() {
  const [stars, setStars] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // EFFECT: Fetch GitHub repository data
  useEffect(() => {
    const fetchGitHubStars = async () => {
      try {
        const response = await fetch(GITHUB_API_URL);

        if (!response.ok) {
          throw new Error(`GitHub API responded with status: ${response.status}`);
        }

        const data: GitHubData = await response.json();
        setStars(data.stargazers_count);
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGitHubStars();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(REPOSITORY_URL, '_blank', 'noopener noreferrer');
  };

  return (
    <div
      className={`
        flex 
        items-center 
        bg-gradient-to-r 
        from-black/90 
        to-black/70 
        backdrop-blur-sm 
        rounded-2xl 
        px-4 
        py-2 
        space-x-3 
        shadow-xl 
        transition-all 
        duration-300 
        cursor-pointer 
        group 
        box-father-github
      `}
      onClick={handleClick}
    >
      <div className="relative">
        {/* ICON: GitHub icon pure white */}
        <svg
          className={`
            w-8 
            h-8 
            text-white 
            group-hover:text-white 
            transition-colors 
            duration-300
          `}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        {/* COUNTER: Stars count */}
        <span
          className={`
          text-white 
          font-bold 
          text-xl 
          group-hover:text-white 
          transition-colors 
          duration-300
        `}
        >
          {isLoading ? '...' : stars.toLocaleString()}
        </span>

        <span
          className={`
          text-white/60 
          text-xs 
          font-medium
        `}
        >
          stars
        </span>
      </div>
    </div>
  );
}

export default StatusBox;
