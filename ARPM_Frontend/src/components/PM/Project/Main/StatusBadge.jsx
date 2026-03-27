function StatusBadge({ status }) {

    const styles = {
        active: "bg-green-100 text-green-700",
        on_hold: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700"
    };

    return (
        <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || "bg-gray-100"}`}>
            {status}
        </span>
    );
}