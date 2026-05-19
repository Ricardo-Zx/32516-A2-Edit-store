/**
 * ScrollToTop — resets the window scroll position whenever the route
 * changes, so navigating into a product (or any page) always starts at
 * the top instead of inheriting the previous page's scroll.
 *
 * @author Mengshan Wang
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
