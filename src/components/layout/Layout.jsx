import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TocRail, { TocProvider } from "./TocRail";

// ─── Styles ──────────────────────────────────────────────────────────────────
const rootStyle = {
  display: "flex",
  height: "100vh",
  overflow: "hidden",
  background: "var(--bg)",
  fontFamily: "'Inter', sans-serif",
  WebkitFontSmoothing: "antialiased",
};

const mainStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  minWidth: 0,
};

const contentWrapStyle = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const contentScrollStyle = {
  flex: 1,
  overflowY: "auto",
  minWidth: 0,
};

const contentInnerStyle = {
  maxWidth: "740px",
  margin: "0 auto",
  padding: "52px 44px 100px",
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const location = useLocation();

  return (
    <TocProvider>
      <div style={rootStyle}>
        {/* Left sidebar — sticky, independently scrollable */}
        <Sidebar />

        {/* Main column: topbar + scrollable content + right TOC */}
        <div style={mainStyle}>
          <Topbar pathname={location.pathname} />

          <div style={contentWrapStyle}>
            {/* Scrollable content area */}
            <div id="content-scroll" style={contentScrollStyle}>
              <div style={contentInnerStyle}>
                <Outlet />
              </div>
            </div>

            {/* Right TOC rail — sticky, independently scrollable */}
            <TocRail />
          </div>
        </div>
      </div>
    </TocProvider>
  );
}
