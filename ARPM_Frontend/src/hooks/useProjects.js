import { useEffect, useState } from "react";

export default function useProjects(pmId) {

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (!pmId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `http://127.0.0.1:8000/projects/pm/${pmId}`
                );

                const data = await res.json();

                if (Array.isArray(data)) {
                    setProjects(data);
                } else {
                    setProjects([]);
                }

            } catch {
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [pmId]);

    return { projects, loading };
}