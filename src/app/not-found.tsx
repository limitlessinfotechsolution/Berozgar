import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-fade">
      <div className="wrap">
        <div className="err">
          <p className="d-xl" style={{ opacity: 0.12 }}>404</p>
          <h1 className="h1" style={{ margin: "10px 0 6px" }}>THIS PAGE DOESN&apos;T EXIST.</h1>
          <p className="d-md" style={{ fontSize: "clamp(1.2rem,2.6vw,2rem)" }}>BUT BEROZGAR DOES.</p>
          <Link href="/" className="btn" style={{ marginTop: "34px" }}>GO HOME</Link>
        </div>
      </div>
    </div>
  );
}
