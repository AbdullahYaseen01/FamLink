import React, { useEffect, useState, useMemo } from "react";
import { Spin, Pagination } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogByCategoryThunk } from "../Redux/blogsSlice";
import { Calendar } from "lucide-react";

const BLOGS_PER_PAGE = 5;

const renderPreview = (content) => {
  return content
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl Livvic-Bold mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl Livvic-SemiBold mb-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl Livvic-Medium mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="w-full object-cover rounded-xl my-4" />'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 underline">$1</a>'
    )
    .replace(/^- (.*$)/gm, '<ul class="list-disc ml-6 mb-4"><li>$1</li></ul>')
    .replace(
      /^\d+\. (.*$)/gm,
      '<ol class="list-decimal ml-6 mb-4"><li>$1</li></ol>'
    )
    .replace(/\n\n/g, '</p><p class="mb-4 text-lg">')
    .replace(/^(.*)$/gm, '<p class="mb-4 text-lg">$1</p>')
    .replace(/<\/p><p class="mb-4"><\/p>/g, '</p><p class="mb-4 text-lg">')
    .replace(/^<p class="mb-4 text-lg"><h/g, "<h")
    .replace(/h[1-3]><\/p>$/gm, (match) => match.replace(/<\/p>$/, ""));
};

export default function Blogs({ category = "Tips for Parents", searchQuery }) {
  const dispatch = useDispatch();
  const { blogsByCategory, isLoading } = useSelector((state) => state.blogs);
  const blogs = useMemo(() => {
    const all = blogsByCategory[category] || [];
    return all
      .filter((b) => !b.isDraft)
      .filter((b) =>
        searchQuery
          ? // eslint-disable-next-line react/prop-types
            b.title.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  }, [blogsByCategory, category, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * BLOGS_PER_PAGE;
    return blogs.slice(start, start + BLOGS_PER_PAGE);
  }, [blogs, currentPage]);

  useEffect(() => {
    dispatch(fetchBlogByCategoryThunk(category));
  }, [category, dispatch]);

  useEffect(() => {
    setSelectedBlog(null);
    setCurrentPage(1);
  }, [category]);

  return (
    <div className="min-h-screen px-4 md:px-16 py-6">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Spin />
        </div>
      ) : selectedBlog ? (
        <div>
          <button
            onClick={() => setSelectedBlog(null)}
            className="mb-6 text-blue-600 Livvic-Medium text-xl"
          >
            ← Back to Blog List
          </button>
          <h1 className="text-4xl Livvic-Bold mb-6 text-gray-900 dark:text-gray-100">
            {selectedBlog.title}
          </h1>
          {selectedBlog.excerpt && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 italic">
              {selectedBlog.excerpt}
            </p>
          )}
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: renderPreview(selectedBlog.content),
            }}
          />
        </div>
      ) : (
        <div>
          {/* <h2 className="text-3xl Livvic-SemiBold mb-6 text-gray-800">
            {category}
          </h2> */}
          {paginatedBlogs.length === 0 ? (
            <p className="text-gray-500 text-xl">No blogs available yet.</p>
          ) : (
            <>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 flex-wrap">
                {paginatedBlogs.map((blog) => (
                  <li
                    key={blog._id}
                    onClick={() => setSelectedBlog(blog)}
                    className="p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {blog.featuredImage ? <img src={blog.featuredImage} alt="blog cover" className="object-cover rounded-[20px] mb-4"/> : <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAflBMVEX///8AAAArKyuDg4MnJyd7e3vX19fT09Pq6ura2tre3t4ZGRkODg74+PgEBAQKCgqMjIwjIyPz8/MbGxtFRUXm5uYwMDA4ODipqam8vLySkpJNTU0+Pj5ycnKampqkpKRdXV1hYWHAwMCzs7NqamrHx8efn59gYGBXV1dJSUmwINnuAAAEu0lEQVR4nO2cbXeqOhBGG0XxDUWqVavYCtbW//8H77WViEBqwgwh55xnf+taXSFbIEySyTw9AQAAAAAAAAAAAAAAAAAAAADAv42/Drs9i3TDtc9vsXmfiBaYfCa8Gi9tWPyw2rBpRF/taVx4j3g8hvN2PYTwRhwe/XHbHkKMh3SP5XPbFhfmA7LIom2HH85Uj32+tYnXsYh3N+CfaB7RrbFJr0/9VUzx45m8/DggNRXKhhZLpt4ZsdzJDrySGvKyZra0H6Q2gXxHO5Rm/KyVOdM3yZxIjpqUIfg1a2TN1jFjTlkf9oRGDtmbxtYtc4JsvDkSGsletS+2btVgmw03hDayoLfH1qsaxNdOrAhtZINWl61XNegxDFsQ4QQiOSDCCURyQIQTiOSACCeWRQbJep3QF20qsCmy7F7/s9Pld7EnEvSmQjLrcs/urYksC0v1K+b1Flsio9Ka6pzXxJJI5BU9hHhhfbosiRzLHkLEhGuWsCPSr/IQU5YNjSt2RA6VIqSlmyJWRALFFinnQpgVkY9qDyEYN5atiOxVIm+EqxawItJViYSEqxaASI6HIq8qEcrSeQErIqlKhDHzwopINK32mDIGKXY+iIrd663RZYJhkqaJr5jK2BFRPFv6iTCD06cMO8fnsOL7Yylo3JUtDPZk0nPx2fTC4o2xJNKfiRITzZjxrWIK8P8cM75XsTWxSkvv+zTVatxfVWl8/xB3aQ7Wprrrwj2Z6XmEigHvm23upthbfPDvJu0rrUyP4EEyW+c2Xba5HHSSKiu9aDGqHCPyeNLE7gLdcB+/f8Ynzbc8Ur4eN2SyhcNLpgOtXM/sEXVXRM/DfZFlR8vDeZFl5VfwzxMZaSffui0y1E9adVrEJInYZRHfJBnaYRHf6MRDSyLRJowPh3j/y8rch9nJjVZE0q2MZcdHRdSYGJ5AaUEkKXyq36t2ejYVMzC3RIK41IdJeUqSmnpIkWwR8KVhkahyIaW40lieR2qLbK5/U7YqdLbeFBH5fT7n2txDilzXN3QXAmqKqCPZ/PZbHY+byOCSMDv/IHg8Fhn8EsneTGp5iNzgN0xJGo9Ffo9ks4f6rZaH4Dzl8UDkUSR7pHhYFHkckX/1nyLlFoozIloRec27YVPEKJJ1WMQsknVXxDCSdVbEgocVkcQ4AnRTxDgid1SkRiTrpEi9yIkkEvSJOZ9VInUjjvoiweWk64KUAlYhokyjaU7kZ0/omXJTyiLKnI3mRLJUKsrRu5JIqLpqgyJZ1Ml5fG9o0aPRVRRfdVGIQAQiEIEIRCACEYhABCKuilSfqGqIrFZQEyKqVPgmmGXp9Y1sTx/sichN3EZEdLIqedjJQljNJAwErwsb9ecW+9u5DQ6Rv6YI0l9TlupwbYNYko8ES6Ewua7IeKzQFJbSbQ4U0xvIPVdSPVOZoXFuvbwhJcspv2a9a6Xg5Oj23aIVnIxum+mzuIEK1b/DWAL0fjtkNvcsMr/bqSQPN2fhBGYHG6sYtF5I+oLHUDdm6EAp6WeWGhIjzfMezdFhGjGjQ7seR76vcfLwkFpz7IjpjAU+jq1UK38+8mp8M0r3Ydci4T7lrBMDAAAAAAAAAAAAAAAAAAAAAAB/Iv8BOsFRVwkkrQYAAAAASUVORK5CYII=" alt="default image" className="object-cover"/>}
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="Livvic-SemiBold text-lg">
                            {blog.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center Livvic-SemiBold text-sm text-[#555555]">
                            <Calendar className="w-4 h-4 mr-1" />
                            {blog.isDraft && blog.publishedAt
                              ? new Date(blog.publishedAt).toLocaleDateString()
                              : `Created ${new Date(
                                  blog.createdAt
                                ).toLocaleDateString()}`}
                          </div>
                        </div>
                        <p className="text-sm Livvic-Medium text-[#666666] line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={BLOGS_PER_PAGE}
                  total={blogs.length}
                  onChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
