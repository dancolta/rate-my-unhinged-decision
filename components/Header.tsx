export default function Header() {
  return (
    <header className="text-left">
      <h1
        className="font-heading text-[32px] md:text-[40px] lg:text-[48px] font-bold uppercase leading-none tracking-tight text-text-primary"
        style={{ letterSpacing: "-0.02em" }}
      >
        Rate My Unhinged Decision
      </h1>
      <p className="mt-2 font-body text-sm lg:text-base text-text-secondary">
        confess. get judged. share the damage.
      </p>
    </header>
  );
}
