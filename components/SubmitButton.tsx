"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`bg-black text-white py-2 rounded-md transition-all px-4 ${pending ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 hover:-translate-y-0.5"}`}
    >
      {pending ? "🛠️ AI가 글을 정리하는 중..." : "✨ 내 이야기로 정리해줘"}
    </button>
  );
}
