import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(form);

      navigate("/home");
    } catch (error) {
      setError(
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-orange-600">
            Join Nexo
          </h1>

          <p className="mt-2 text-gray-600">
            Connect. Share. Grow.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
      


          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Email"
            className="w-full rounded border px-4 py-3 outline-none focus:border-orange-600  focus:ring-orange-600"
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Password"
            className="w-full rounded border px-4 py-3 outline-none focus:border-orange-600 focus:ring-orange-600"
          />

          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#FF4D00] py-3 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Logging..." : "Login to Your account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Dont' have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-orange-600 hover:text-orange-600"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;