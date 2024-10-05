import Link from "next/link";

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/menu">Menu</Link>
    </nav>
  );
}

export default Navigation;
