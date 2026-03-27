import { useEffect, useState } from "react";

export default function useEligibleProposals(pmId) {

    const [proposals, setProposals] = useState([]);

    useEffect(() => {
        if (!pmId) return;

        fetch(`http://127.0.0.1:8000/projects/eligible-proposals/${pmId}`)
            .then(res => res.json())
            .then(data => {
                setProposals(Array.isArray(data) ? data : []);
            })
            .catch(() => setProposals([]));

    }, [pmId]);

    return { proposals };
}