import React from 'react';
import FixtureCard, { FixtureCardProps } from '@/components/FixtureCard';
import AdBanner from '@/components/AdBanner';


interface LeagueFixturesProps {
    fixtures: FixtureCardProps[];
}

const LeagueFixtures: React.FC<LeagueFixturesProps> = ({ fixtures }) => {
    if (!fixtures || fixtures.length === 0) {
        return <div className="p-4 text-center text-gray-500">No recent fixtures available.</div>;
    }

    return (
        <div className="flex flex-col">
            {fixtures.map((fixture, index) => (
                <React.Fragment key={fixture.fixtureId}>
                    <FixtureCard {...fixture} index={index} />
                    {index === 5 && <AdBanner />}

                </React.Fragment>
            ))}
        </div>
    );
};

export default LeagueFixtures;
