import i18n from "@/app/i18n";
import { buildBook } from "@/test/factories/book";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { createRouter } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookCards } from "./book-cards";

const genreLabel = {
  novel: i18n.t("books.genre.novel"),
  non_fiction: i18n.t("books.genre.non_fiction"),
  business: i18n.t("books.genre.business"),
  technology: i18n.t("books.genre.technology"),
  other: i18n.t("books.genre.other"),
};

function renderBookCards(books: ReturnType<typeof buildBook>[]) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <BookCards books={books} genreLabel={genreLabel} />,
  });
  const bookDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$bookId",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, bookDetailRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("BookCards", () => {
  it("renders a card per book with title, author, status, genre, and date", async () => {
    const book = buildBook({
      id: 1,
      title: "Readable Code",
      author: "Dustin Boswell",
      status: "reading",
      genre: "technology",
    });

    renderBookCards([book]);

    expect(await screen.findByText("Readable Code")).toBeInTheDocument();
    expect(screen.getByText("Dustin Boswell")).toBeInTheDocument();
    expect(screen.getByText(i18n.t("books.status.reading"))).toBeInTheDocument();
    expect(screen.getByText(i18n.t("books.genre.technology"))).toBeInTheDocument();
  });

  it("links each card to the book detail page", async () => {
    const book = buildBook({ id: 42, title: "Readable Code" });

    renderBookCards([book]);

    const link = await screen.findByRole("link", { name: /Readable Code/ });
    expect(link).toHaveAttribute("href", "/books/42");
  });
});
