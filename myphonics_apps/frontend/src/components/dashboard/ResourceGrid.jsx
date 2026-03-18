import React from 'react';
import ResourceCard from './ResourceCard';

export default function ResourceGrid({ resources, typeFilter }) {
    const filteredResources = typeFilter === 'all'
        ? resources
        : resources.filter(r => r.type === typeFilter);

    if (filteredResources.length === 0) {
        return (
            <div className="py-24 text-center">
                <p className="font-mono text-slate-400 uppercase tracking-widest text-sm mb-4">
          // No resources found
                </p>
                <h3 className="font-display text-2xl font-bold text-slate-800">
                    Empty Nexus
                </h3>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {filteredResources.map((resource) => (
                <React.Fragment key={resource.id}>
                    {ResourceCard(resource)}
                </React.Fragment>
            ))}
        </div>
    );
}
