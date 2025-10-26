import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAlert } from "../../context/AlertContext";

export default function RatingStars({ pinId, userId }) {
  const [rating, setRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [hover, setHover] = useState(0);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!pinId) return;
    (async () => {
      const { data: ratings } = await supabase
        .schema("omd")
        .from("pin_ratings")
        .select("rating")
        .eq("pin_id", pinId);

      if (ratings?.length) {
        const total = ratings.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(total / ratings.length);
        setCount(ratings.length);
      }

      if (userId) {
        const { data: my } = await supabase
          .schema("omd")
          .from("pin_ratings")
          .select("rating")
          .eq("pin_id", pinId)
          .eq("user_id", userId)
          .maybeSingle();
        if (my) setRating(my.rating);
      }
    })();
  }, [pinId, userId]);

  async function handleRate(value) {
    if (!userId) //return alert("Sign in to rate");
    showAlert({ message: "Sign in to rate", type: "warning" });
    setRating(value);

    const { error } = await supabase
      .schema("omd")
      .from("pin_ratings")
      .upsert(
        { pin_id: pinId, user_id: userId, rating: value },
        { onConflict: "pin_id,user_id" }
      );

    if (error) console.error(error);
    else {
      const { data: ratings } = await supabase
        .schema("omd")
        .from("pin_ratings")
        .select("rating")
        .eq("pin_id", pinId);
      if (ratings?.length) {
        const total = ratings.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(total / ratings.length);
        setCount(ratings.length);
      }
    }
  }

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => handleRate(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl focus:outline-none"
          >
            <span
              className={
                (hover || rating) >= i ? "text-yellow-400" : "text-neutral-300"
              }
            >
              ★
            </span>
          </button>
        ))}
        <span className="ml-2 text-sm text-neutral-600">
          {avgRating.toFixed(1)} ({count})
        </span>
      </div>
    </div>
  );
}
