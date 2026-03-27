import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_PATH = {
    project_manager: "manager",
    committee:       "committee",
    lead_researcher: "researcher",
    reviewer:        "reviewer",
};

export default function SideNavBarInvestigator({ isSidebarOpen, setIsSidebarOpen }) {

    const location = useLocation();
    const { user } = useAuth();
    const rolePrefix = ROLE_PATH[user?.role] ?? ""; // e.g. "manager", "committee"

    const linkStyle = (path) =>
        `flex items-center px-4 py-2 rounded-lg transition duration-300 transform ${location.pathname === path
            ? "bg-purple-500 text-white scale-105 shadow-lg"
            : "text-gray-700 hover:bg-purple-500 hover:text-white hover:scale-105"
        }`;

    return (
        <div className="fixed h-screen flex z-40">

            <div
                className={`fixed top-0 left-0 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } h-full w-80 bg-gray-100 shadow-lg z-40`}
            >
                <div className="flex flex-col h-full p-4 mt-24">
                    <ul className="flex flex-col space-y-2 mt-20">

                        <li>
                            <Link
                                to={`/${rolePrefix}/dashboard`}
                                className={linkStyle(`/${rolePrefix}/dashboard`)}
                            >
                                Dashboard
                            </Link>
                        </li>

                        <li>
                            <Link
                                to={`/${rolePrefix}/home`}
                                className={linkStyle(`/${rolePrefix}/home`)}
                            >
                                Home
                            </Link>
                        </li>

                        <li>
                            <Link
                                to={`/${rolePrefix}/proposals`}
                                className={linkStyle(`/${rolePrefix}/proposals`)}
                            >
                                Proposals
                            </Link>
                        </li>

                        <li>
                            <Link
                                to="/communication"
                                className={linkStyle("/communication")}
                            >
                                Communication
                            </Link>
                        </li>

                    </ul>
                </div>
            </div>

            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mt-24 fixed font-extrabold h-10 top-8 left-4 z-50 bg-white px-[12px] rounded-lg border-2 border-purple-500 text-purple-500"
            >
                {isSidebarOpen ? "◁" : "▷"}
            </button>

        </div>
    );
}