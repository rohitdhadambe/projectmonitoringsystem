import { useEffect, useState } from "react";

export default function useResearcherProjects(researcher_id) {

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!researcher_id) {
            setLoading(false);
            return;
        }
        fetchProjects();
    }, [researcher_id]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            // ✅ Uses the researcher-specific endpoint
            // → finds proposals where lead_researcher_id = researcher_id AND status = approved
            // → returns projects linked to those proposals
            const res = await fetch(
                `http://127.0.0.1:8000/projects/researcher/${researcher_id}`
            );
            if (!res.ok) throw new Error("Failed to fetch projects");
            const data = await res.json();
            setProjects(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { projects, loading, error, refetch: fetchProjects };
}