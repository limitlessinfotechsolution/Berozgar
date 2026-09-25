/* A failed submit, said once above the button. */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div className="co-fail inline" role="alert" style={{ margin: "0 0 18px" }}>
      <b>{message}</b>
    </div>
  );
}
