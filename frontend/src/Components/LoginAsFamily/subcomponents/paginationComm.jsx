import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import {
  fetchAllCommunityThunk,
  fetchPostByIdThunk,
  postCommentThunk,
  postCommLikeThunk,
  postCommDislikeThunk,
  postReplyLikeThunk,
  postCommentLikeThunk,
  postCommentDislikeThunk,
  postReplyDislikeThunk,
  replyPostReplyThunk,
  createPostThunk,
} from "../../Redux/communitySlice";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { api } from "../../../Config/api";
import Blogs from "../../Blogs/Blogs";
import {
  Loader2,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Image,
  Video,
  Smile,
  Plus,
  X,
  Menu,
  ChevronDown,
  Shield,
} from "lucide-react";
import { SelectComponent } from "../../subComponents/input";
import { Select } from "antd";

const dateFormatting = (date) => {
  const createdAtDate = new Date(date);
  const now = new Date();

  const isYesterday =
    now.getDate() - createdAtDate.getDate() === 1 &&
    now.getMonth() === createdAtDate.getMonth() &&
    now.getFullYear() === createdAtDate.getFullYear();

  const formatTime = createdAtDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isYesterday) {
    return `${formatTime}, Yesterday`;
  }

  const isToday =
    now.getDate() === createdAtDate.getDate() &&
    now.getMonth() === createdAtDate.getMonth() &&
    now.getFullYear() === createdAtDate.getFullYear();

  if (isToday) {
    return `${formatTime}, Today`;
  }

  // Default: show date like "Jul 25, 2025"
  const formattedDate = createdAtDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatTime}, ${formattedDate}`;
};

const PaginationComm = ({ category, searchQuery }) => {
  const dispatch = useDispatch();
  const { data: communities, isLoading } = useSelector(
    (state) => state.community
  );
  const { user } = useSelector((state) => state.auth);

  const [activePostId, setActivePostId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [posts, setPosts] = useState([]);
  const [adminPosts, setAdminPosts] = useState([]);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [quotedText, setQuotedText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [postCreators, setPostCreators] = useState({});
  const [localCommunities, setLocalCommunities] = useState([]);
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [deletePostId, setDeletePostId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminPosts, setShowAdminPosts] = useState(false);
  const [showTopicsDropdown, setShowTopicsDropdown] = useState(false);
  const [isLiking, setIsLiking] = useState({})
  const [filteredPosts, setFilteredPosts] = useState([]);

  const handleTopicChange = (value) => {
    setSelectedTopic(value);
    // you can do additional logic here like filtering, etc.
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !selectedTopic) return;

    await dispatch(
      createPostThunk({
        topicId: selectedTopic,
        description: postContent,
        anonymous: isAnonymous,
        mediaFiles,
      })
    );

    setPostContent("");
    setSelectedTopic("");
    setMediaFiles([]);
    setIsAnonymous(false);
    setIsCreatePostModalOpen(false);
    dispatch(fetchAllCommunityThunk());
    await fetchAllData();
  };

  const handleDeleteComment = async () => {
    if (!activePostId || !deleteCommentId) return;

    try {
      await api.delete(`/community/${activePostId}/comment/${deleteCommentId}`);

      const res = await dispatch(fetchPostByIdThunk(activePostId));
      const updated = res.payload?.data;
      if (updated) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === updated._id ? { ...p, comments: updated.comments } : p
          )
        );
      }

      setIsDeleteDialogOpen(false);
      setDeleteCommentId(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      setIsDeletingPost(true);
      await api.delete(`/community/${deletePostId}`);

      setPosts((prev) => prev.filter((p) => p._id !== deletePostId));
      setAdminPosts((prev) => prev.filter((p) => p._id !== deletePostId));
      setIsDeleteDialogOpen(false);
      setDeletePostId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeletingPost(false);
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      const res = await dispatch(fetchAllCommunityThunk());
      const fetchedCommunities = res.payload?.data?.data || [];
      setLocalCommunities(fetchedCommunities);

      const allPosts = fetchedCommunities.flatMap((comm) =>
        (comm.topics || []).flatMap((topic) =>
          (topic.posts || []).map((post) => ({
            ...post,
            topicId: topic._id,
            topicName: topic.name,
            communityId: comm._id,
          }))
        )
      );
      setPosts(allPosts);

      const userIds = new Set();

      for (const post of allPosts) {
        const postUserId = post.createdBy?.$oid || post.createdBy;
        if (!post.isAnonymous) {
          userIds.add(postUserId);
        }

        for (const comment of post.comments || []) {
          const commentUserId = comment.user?._id;
          if (!comment.isAnonymous) {
            userIds.add(commentUserId);
          }

          for (const reply of comment.replies || []) {
            const replyUserId =
              typeof reply.user === "string" ? reply.user : reply.user?._id;
            if (!reply.isAnonymous) {
              userIds.add(replyUserId);
            }
          }
        }
      }

      const userMap = {};

      await Promise.all(
        Array.from(userIds).map(async (id) => {
          try {
            const res = await api.get(`/userData/getUserById/${id}`);
            const data = res.data?.data;
            userMap[id] = {
              name: data?.name || "User",
              profilePic: data?.imageUrl || null,
              type: data?.type || "User",
            };
          } catch {
            userMap[id] = { name: "User", profilePic: null, type: "User" };
          }
        })
      );

      setPostCreators(userMap);

      // Filter admin posts
      const adminPostsFiltered = allPosts.filter((post) => {
        const creator = userMap[post.createdBy];
        return creator?.type === "Admin";
      });
      setAdminPosts(adminPostsFiltered);
    } catch (err) {
      console.error("Error fetching community or user data:", err);
    }
  }, [dispatch]);

 useEffect(() => {
  setFilteredPosts(() => {
    if (!posts) return [];

    let filtered = posts;

    // Filter by topic first
    if (selectedTopic) {
      filtered = filtered.filter(
        post => post.topicName?.toLowerCase() === selectedTopic.toLowerCase()
      );
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        post =>
          post.topicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  });
}, [posts, searchQuery, selectedTopic]);


  useEffect(() => {
    if (user?._id) {
      setCurrentUserId(user._id.toString());
    }
    fetchAllData();
  }, [fetchAllData, user]);

  const activePost = posts.find((p) => p._id === activePostId);

  const handlePostReply = () => {
    if (replyText.trim() && activePostId) {
      dispatch(
        postCommentThunk({
          id: activePostId,
          comment: replyText,
          isAnonymous: isAnonymous,
        })
      ).then(() => {
        dispatch(fetchPostByIdThunk(activePostId)).then((res) => {
          const updated = res.payload?.data;
          if (updated) {
            setPosts((prev) =>
              prev.map((p) =>
                p._id === updated._id ? { ...p, comments: updated.comments } : p
              )
            );
          }
        });
        setReplyText("");
      });
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!activePostId || !commentId) return;

    try {
       setIsLiking((prev) => ({ ...prev, [commentId]: true }));
      await dispatch(postCommentLikeThunk({ postId: activePostId, commentId }));
      const res = await dispatch(fetchPostByIdThunk(activePostId));
      const updated = res.payload?.data;
      if (updated) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === updated._id ? { ...p, comments: updated.comments } : p
          )
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }finally {
       setIsLiking((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleLike = async (postId) => {
    const post = posts.find((p) => p._id === postId);
    const hasLiked = post.likes?.includes(user._id);

    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likes: hasLiked
                ? p.likes.filter((id) => id !== user._id)
                : [...(p.likes || []), user._id],
            }
          : p
      )
    );

    try {
      await dispatch(postCommLikeThunk({ id: postId, comm: false }));
    } catch {
      // Optionally revert UI here
    }
  };

  const handlePostCommentReply = () => {
    if (!replyText.trim()) return;

    if (replyToCommentId) {
      dispatch(
        replyPostReplyThunk({
          postId: activePostId,
          commentId: replyToCommentId,
          reply: replyText,
          isAnonymous: isAnonymous,
        })
      ).then(() => {
        dispatch(fetchPostByIdThunk(activePostId)).then((res) => {
          const updated = res.payload?.data;
          if (updated) {
            setPosts((prev) =>
              prev.map((p) =>
                p._id === updated._id ? { ...p, comments: updated.comments } : p
              )
            );
          }
        });
        setReplyText("");
        setReplyToCommentId(null);
        setQuotedText("");
        setIsReplyModalOpen(false);
      });
    }
  };

  // Comment threading logic with curved lines
  const renderCommentsWithLines = (comments) => {
    if (!comments || comments.length === 0) return null;

    const originalComments = [];
    const replyComments = [];

    comments.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        replyComments.push(comment);
      } else {
        originalComments.push(comment);
      }
    });

    const commentThreads = originalComments.map((originalComment) => {
      const relatedReplies = replyComments.filter(
        (reply) =>
          reply.replies[0].comment === originalComment.comment ||
          reply.replies.some((r) => r.user === originalComment.user?._id)
      );

      return {
        original: originalComment,
        replies: relatedReplies,
      };
    });

    replyComments.forEach((reply) => {
      const hasMatchingOriginal = commentThreads.some((thread) =>
        thread.replies.includes(reply)
      );

      if (!hasMatchingOriginal) {
        commentThreads.push({
          original: {
            ...reply.replies[0],
            _id: `original-${reply._id}`,
            isOriginalFromReply: true,
          },
          replies: [reply],
        });
      }
    });

    return commentThreads
      .sort(
        (a, b) =>
          new Date(a.original.createdAt) - new Date(b.original.createdAt)
      )
      .map((thread, threadIndex) => {
        const originalComment = thread.original;
        const commentUser = !originalComment.isAnonymous
          ? postCreators[originalComment.user?._id || originalComment.user]
          : {};

        return (
          <div
            key={originalComment._id || `thread-${threadIndex}`}
            className="relative"
          >
            {/* Original Comment */}
            <div className="flex items-start space-x-3">
              {commentUser?.profilePic && !originalComment.isAnonymous ? (
                <img
                  src={commentUser.profilePic}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <Avatar
                  name={
                    originalComment.isAnonymous
                      ? "Anonymous"
                      : commentUser?.name || "User"
                  }
                  size="40"
                  round
                  className="text-white flex-shrink-0"
                  color="#6B7280"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl px-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="Livvic-SemiBold text-sm text-gray-900">
                      {originalComment.isAnonymous
                        ? "Anonymous"
                        : commentUser?.name || "User"}
                    </h4>
                    {commentUser?.type === "Admin" && (
                      <Shield className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="Livvic-Medium text-xs -mt-2 text-[#555555]">
                    {dateFormatting(originalComment.createdAt)}
                  </span>
                  <p className="Livvic-Medium text-sm break-words">
                    {originalComment.comment}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 px-2">
                  {!originalComment.isOriginalFromReply && (
                    <>
                      <button
                        onClick={() => handleCommentLike(originalComment._id)}
                        className="hover:text-red-500 Livvic-Medium"
                      >
                        {isLiking[originalComment._id] ? (
                          <Loader2 className="inline w-3 h-3 animate-spin text-red-500" />
                        ) : (
                          `Like (${originalComment.likes?.length || 0})`
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setReplyToCommentId(originalComment._id);
                          setQuotedText(originalComment.comment);
                          setIsReplyModalOpen(true);
                        }}
                        className="hover:text-blue-500 Livvic-Medium"
                      >
                        Reply
                      </button>
                      {currentUserId === originalComment.user?._id && (
                        <button
                          onClick={() => {
                            setDeletePostId(null);
                            setDeleteCommentId(originalComment._id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="hover:text-red-500 Livvic-Medium"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Replies with Vertical Line + Dot */}
            {thread.replies.length > 0 && (
              <div className="relative ml-12 pl-6 space-y-4 mt-4">
                {thread.replies
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((reply, replyIndex) => {
                    const replyUser = !reply.isAnonymous
                      ? postCreators[
                          typeof reply.user === "string"
                            ? reply.user
                            : reply.user?._id
                        ]
                      : {};

                    return (
                      <div key={reply._id} className="relative">
                        {/* Dot before each reply */}
                        <div className="flex items-start space-x-3">
                          {replyUser?.profilePic && !reply.isAnonymous ? (
                            <img
                              src={replyUser.profilePic}
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <Avatar
                              name={
                                reply.isAnonymous
                                  ? "Anonymous"
                                  : replyUser?.name
                              }
                              size="32"
                              round
                              className="text-white flex-shrink-0"
                              color="#6B7280"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-2xl px-3 ">
                              <div className="flex items-center space-x-2">
                                <h4 className="Livvic-SemiBold text-sm text-gray-900">
                                  {reply.isAnonymous
                                    ? "Anonymous"
                                    : replyUser?.name}
                                </h4>
                                {replyUser?.type === "Admin" && (
                                  <Shield className="w-3 h-3 text-blue-600" />
                                )}
                              </div>
                              <span className="Livvic-Medium text-xs !mt-1 text-[#555555]">
                                {dateFormatting(reply.createdAt)}
                              </span>
                              <p className="Livvic-Medium text-sm break-words">
                                {reply.comment}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 px-2">
                              <button
                                onClick={() => handleCommentLike(reply._id)}
                                className="hover:text-red-500 Livvic-Medium"
                              >
                                {isLiking[reply._id] ? (
                                  <Loader2 className="inline w-3 h-3 animate-spin text-red-500" />
                                ) : (
                                  `Like (${reply.likes?.length || 0})`
                                )}
                              </button>
                              {/* <button
                                onClick={() => {
                                  setReplyToCommentId(originalComment._id);
                                  setQuotedText(reply.comment);
                                  setIsReplyModalOpen(true);
                                }}
                                className="hover:text-blue-500 Livvic-Medium"
                              >
                                Reply
                              </button> */}
                              {currentUserId === reply.user?._id && (
                                <button
                                  onClick={() => {
                                    setDeletePostId(null);
                                    setDeleteCommentId(reply._id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="hover:text-red-500 Livvic-Medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      });
  };

  if (category !== "Community Resources") {
    return <Blogs category={category} searchQuery={searchQuery} />;
  }

  return (
    <div className="max-w-full mx-auto relative">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4 flex gap-2 flex-wrap">
            <div
              className={`${
                showAdminPosts
                  ? "bg-[#AEC4FF] text-primary"
                  : "bg-white border border-[#EEEEEE] text-[#555555]"
              } px-4 py-2 rounded-full w-fit h-fit Livvic-Medium cursor-pointer`}
              onClick={() => setShowAdminPosts(!showAdminPosts)}
            >
              {showAdminPosts ? "View Non-Admin Posts" : "View Admin Posts"}
            </div>
            <Select
              value={selectedTopic}
              onChange={handleTopicChange}
              // placeholder="Select Topic"
              className="w-72 rounded-full shadow-sm border border-gray-200 hover:border-gray-400 focus:border-primary"
              style={{
                height: "40px",
                width: "180px",
              }}
              dropdownStyle={{
                borderRadius: "10px",
              }}
              bordered={false}
            >
              <option value="">Select Topic</option>
              {(Array.isArray(localCommunities)
                ? localCommunities
                    .flatMap((comm) => comm.topics || [])
                    .slice(0, 8)
                    .map((topic) => topic.name !== "Admin" && topic.name)
                : []
              ).map((opt) => (
                <Select.Option key={opt} value={opt}>
                  <span className="text-sm Livvic-Medium text-gray-800">
                    {opt}
                  </span>
                </Select.Option>
              ))}
            </Select>

            {/* <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm border"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button> */}

            {/* {showMobileMenu && (
              <div className="mt-2 bg-white rounded-lg shadow-lg border p-4 space-y-3">
                <button
                  onClick={() => {
                    setShowAdminPosts(!showAdminPosts);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Admin Posts</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowTopicsDropdown(!showTopicsDropdown)}
                    className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded"
                  >
                    <span>Topics</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showTopicsDropdown && (
                    <div className="mt-1 bg-gray-50 rounded p-2 space-y-1">
                      {Array.isArray(localCommunities) &&
                        localCommunities
                          .flatMap((comm) => comm.topics || [])
                          .slice(0, 5)
                          .map((topic) => (
                            <button
                              key={topic._id}
                              className="block w-full text-left text-sm p-1 hover:bg-white rounded"
                            >
                              {topic.name}
                            </button>
                          ))}
                    </div>
                  )}
                </div>
              </div>
            )} */}
          </div>

          <div className="flex gap-6">
            {/* Left Column - Admin Posts (Desktop Only) */}
            <div className="hidden lg:block w-80 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="Livvic-Bold text-lg text-gray-900">
                      Admin Posts
                    </h3>
                  </div>
                </div> */}

                <div className="max-h-96 overflow-y-auto">
                  {adminPosts.length > 0 ? (
                    <div className="space-y-1">
                      {adminPosts.map((post) => {
                        const creator = postCreators[post.createdBy];
                        return (
                          <div
                            key={post._id}
                            onClick={() => setActivePostId(post._id)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                              activePostId === post._id
                                ? "bg-blue-50 border-l-4 border-l-blue-600"
                                : ""
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              {creator?.profilePic && !post.isAnonymous ? (
                                <img
                                  src={creator.profilePic}
                                  alt="Profile"
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <Avatar
                                  name={
                                    post.isAnonymous
                                      ? "Anonymous"
                                      : creator?.name || "Admin"
                                  }
                                  size="32"
                                  round
                                  className="text-white flex-shrink-0"
                                  color="#3B82F6"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="Livvic-SemiBold text-sm text-gray-900 truncate">
                                    {post.isAnonymous
                                      ? "Anonymous"
                                      : creator?.name || "Admin"}
                                  </h4>
                                  <Shield className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                </div>
                                <p className="text-xs text-gray-600 Livvic-Medium mb-1 truncate">
                                  {post.topicName}
                                </p>
                                <p className="text-xs text-gray-800 line-clamp-2">
                                  {post.description}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {dateFormatting(post.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No admin posts yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Expanded Post View or Posts List */}
            <div className="flex-1 max-w-4xl">
              {activePostId && activePost ? (
                /* Expanded Post View */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {/* Post Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const creator = postCreators[activePost.createdBy];
                          return (
                            <>
                              {creator?.profilePic &&
                              !activePost.isAnonymous ? (
                                <img
                                  src={creator.profilePic}
                                  alt="Profile"
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <Avatar
                                  name={
                                    activePost.isAnonymous
                                      ? "Anonymous"
                                      : creator?.name || "User"
                                  }
                                  size="48"
                                  round
                                  className="text-white"
                                  color="#6B7280"
                                />
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="Livvic-Bold text-gray-900">
                                    {activePost.isAnonymous
                                      ? "Anonymous"
                                      : creator?.name || "User"}
                                  </h3>
                                  {creator?.type === "Admin" && (
                                    <Shield className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {dateFormatting(activePost.createdAt)}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <button
                        onClick={() => setActivePostId(null)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* <h2 className="text-2xl Livvic-Bold mb-3 text-gray-900">
                      {activePost.topicName}
                    </h2> */}
                    <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap break-words">
                      {activePost.description}
                    </p>

                    {/* Media */}
                    {activePost.media && activePost.media.length > 0 && (
                      <div className="mt-4 rounded-lg overflow-hidden">
                        {activePost.media.length === 1 ? (
                          <div className="w-full">
                            {activePost.media[0].type === "image" ? (
                              <img
                                src={activePost.media[0].url}
                                alt="Post media"
                                className="w-full h-auto object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={activePost.media[0].url}
                                controls
                                className="w-full h-auto object-cover rounded-lg"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {activePost.media
                              .slice(0, 4)
                              .map((mediaItem, idx) => (
                                <div key={idx} className="aspect-square">
                                  {mediaItem.type === "image" ? (
                                    <img
                                      src={mediaItem.url}
                                      alt={`media-${idx}`}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <video
                                      src={mediaItem.url}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(activePost._id)}
                          className={`flex items-center space-x-2 ${
                            activePost.likes?.includes(user._id)
                              ? "text-red-500"
                              : "text-gray-500 hover:text-red-500"
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              activePost.likes?.includes(user._id)
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          <span className="text-sm Livvic-Medium">
                            {activePost.likes?.length || 0}
                          </span>
                        </button>

                        <div className="flex items-center space-x-2 text-gray-500">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm Livvic-Medium">
                            {activePost.comments?.length || 0}
                          </span>
                        </div>

                        {/* <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                          <Share className="w-5 h-5" />
                          <span className="text-sm Livvic-Medium">Share</span>
                        </button> */}
                      </div>

                      {currentUserId === activePost.createdBy && (
                        <button
                          onClick={() => {
                            setDeleteCommentId(null);
                            setDeletePostId(activePost._id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-600 text-sm Livvic-Medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="p-6">
                    <h3 className="Livvic-SemiBold text-lg text-gray-900 mb-6">
                      Comments ({activePost.comments?.length || 0})
                    </h3>

                    {/* Comments List with Curved Lines */}
                    <div className="space-y-6 mb-6">
                      {activePost.comments && activePost.comments.length > 0 ? (
                        renderCommentsWithLines(activePost.comments)
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No comments yet</p>
                          <p className="text-sm">Be the first to comment!</p>
                        </div>
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="border-t border-gray-100 pt-6">
                      <div className="flex items-start space-x-3">
                        {user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <Avatar
                            name={user?.name || "User"}
                            size="40"
                            round
                            className="text-white flex-shrink-0"
                            color="#3B82F6"
                          />
                        )}
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your comment..."
                            className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4">
                              {/* <Smile className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" /> */}
                              <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={isAnonymous}
                                  onChange={(e) =>
                                    setIsAnonymous(e.target.checked)
                                  }
                                  className="rounded"
                                />
                                Anonymous
                              </label>
                            </div>
                            <button
                              onClick={handlePostReply}
                              disabled={!replyText.trim()}
                              className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm Livvic-Medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile Admin Posts Toggle */}
                  {showAdminPosts && (
                    <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      {/* <div className="flex items-center space-x-2 mb-4">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h3 className="Livvic-Bold text-lg text-gray-900">
                          Admin Posts
                        </h3>
                      </div> */}

                      {adminPosts.length > 0 ? (
                        <div className="space-y-3">
                          {adminPosts.slice(0, 3).map((post) => {
                            const creator = postCreators[post.createdBy];
                            return (
                              <div
                                key={post._id}
                                onClick={() => {
                                  setActivePostId(post._id);
                                  setShowAdminPosts(false);
                                }}
                                className="p-3 cursor-pointer hover:bg-gray-50 rounded-lg border"
                              >
                                <div className="flex items-start space-x-3">
                                  {creator?.profilePic && !post.isAnonymous ? (
                                    <img
                                      src={creator.profilePic}
                                      alt="Profile"
                                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <Avatar
                                      name={
                                        post.isAnonymous
                                          ? "Anonymous"
                                          : creator?.name || "Admin"
                                      }
                                      size="32"
                                      round
                                      className="text-white flex-shrink-0"
                                      color="#3B82F6"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className="Livvic-SemiBold text-sm text-gray-900">
                                        {post.isAnonymous
                                          ? "Anonymous"
                                          : creator?.name || "Admin"}
                                      </h4>
                                      <Shield className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <p className="text-xs text-gray-600 Livvic-Medium mb-1">
                                      {post.topicName}
                                    </p>
                                    <p className="text-sm text-gray-800 line-clamp-2">
                                      {post.description}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {dateFormatting(post.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No admin posts yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create Post - Hidden on mobile */}
                  <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start space-x-3">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          name={user?.name || "User"}
                          size="40"
                          round
                          className="text-white"
                          color="#3B82F6"
                        />
                      )}
                      <div className="flex-1">
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="Write your post..."
                          className="w-full text-gray-700 rounded-[20px] placeholder-gray-500 resize-none border-none outline-none text-lg"
                          rows={3}
                        />

                        {postContent.trim() && (
                          <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <select
                                value={selectedTopic}
                                onChange={(e) =>
                                  setSelectedTopic(e.target.value)
                                }
                                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                              >
                                <option value="">Select Topic</option>
                                {Array.isArray(communities) &&
                                  communities
                                    .flatMap((comm) =>
                                      (comm.topics || []).map((topic) => ({
                                        ...topic,
                                        communityName: comm.name,
                                      }))
                                    )
                                    .slice(0, 5)
                                    .map(
                                      (topic) =>
                                        topic.name !== "Admin" && (
                                          <option
                                            key={topic._id}
                                            value={topic._id}
                                          >
                                            {topic.name} — {topic.communityName}
                                          </option>
                                        )
                                    )}
                              </select>

                              <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={isAnonymous}
                                  onChange={(e) =>
                                    setIsAnonymous(e.target.checked)
                                  }
                                  className="rounded"
                                />
                                Stay Anonymous
                              </label>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-4">
                                <input
                                  id="media-upload"
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  onChange={(e) =>
                                    setMediaFiles(Array.from(e.target.files))
                                  }
                                  className="hidden"
                                />
                                <label
                                  htmlFor="media-upload"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer"
                                >
                                  <Image className="w-5 h-5" />
                                  <span className="text-sm Livvic-Medium">
                                    Photo/Video
                                  </span>
                                </label>
                              </div>

                              <button
                                onClick={handleCreatePost}
                                disabled={!selectedTopic}
                                className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm Livvic-Medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Share Post
                              </button>
                            </div>

                            {mediaFiles.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                {mediaFiles.slice(0, 4).map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="relative aspect-square rounded-lg overflow-hidden"
                                  >
                                    {/* Remove button */}
                                    <div
                                      onClick={() =>
                                        setMediaFiles((prev) =>
                                          prev.filter((_, i) => i !== idx)
                                        )
                                      }
                                      className="absolute top-1 right-1 z-30 cursor-pointer w-fit p-1 rounded-full bg-[#151515]"
                                    >
                                      <X className=" text-gray-200 w-4 h-4" />
                                    </div>
                                    {file.type.startsWith("image") ? (
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <video
                                        src={URL.createObjectURL(file)}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Posts List for Mobile/When No Post Selected */}
                  <div className="space-y-6 max-h-[calc(100vh-2rem)] w-full max-w-full overflow-x-hidden px-2 overflow-y-scroll thin-scrollbar">
                    {/* Posts Feed */}
                    {!showAdminPosts &&
                      filteredPosts.map((post) => {
                        const creator = postCreators[post.createdBy];
                        const hasLiked = post.likes?.includes(user._id);

                        return (
                          <div
                            key={post._id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200"
                          >
                            {/* Post Header */}
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {creator?.profilePic && !post.isAnonymous ? (
                                  <img
                                    src={creator.profilePic}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <Avatar
                                    name={
                                      post.isAnonymous
                                        ? "Anonymous"
                                        : creator?.name || "User"
                                    }
                                    size="40"
                                    round
                                    className="text-white"
                                    color="#6B7280"
                                  />
                                )}
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="Livvic-SemiBold text-sm">
                                      {post.isAnonymous
                                        ? "Anonymous"
                                        : creator?.name || "User"}
                                    </h3>
                                    {creator?.type === "Admin" && (
                                      <Shield className="w-4 h-4 text-blue-600" />
                                    )}
                                  </div>
                                  <p className="Livvic-Medium text-[#555555] text-xs">
                                    {dateFormatting(post.createdAt)}
                                  </p>
                                </div>
                              </div>
                              {/* <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                          </button> */}
                            </div>

                            {/* Post Content */}
                            <div className="px-4 pb-3">
                              {/* <h2 className="Livvic-Bold text-lg mb-2 text-gray-900">
                                {post.topicName}
                              </h2> */}

                              {/* Media */}
                              {post.media && post.media.length > 0 && (
                                <div className="mt-3 rounded-lg overflow-hidden">
                                  {post.media.length === 1 ? (
                                    <div className="aspect-video">
                                      {post.media[0].type === "image" ? (
                                        <img
                                          src={post.media[0].url}
                                          alt="Post media"
                                          className="w-full h-full object-cover max-w-full"
                                        />
                                      ) : (
                                        <video
                                          src={post.media[0].url}
                                          controls
                                          className="w-full h-full object-cover max-w-full"
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-1">
                                      {post.media
                                        .slice(0, 4)
                                        .map((mediaItem, idx) => (
                                          <div
                                            key={idx}
                                            className="aspect-square"
                                          >
                                            {mediaItem.type === "image" ? (
                                              <img
                                                src={mediaItem.url}
                                                alt={`media-${idx}`}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <video
                                                src={mediaItem.url}
                                                className="w-full h-full object-cover"
                                              />
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className="Livvic-SemiBold text-sm text-primary whitespace-pre-wrap break-words break-all overflow-wrap break-word">
                                {post.description}
                              </p>
                            </div>

                            {/* Post Actions */}
                            <div className="px-4 py-3 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 md:space-x-6">
                                  <button
                                    onClick={() => handleLike(post._id)}
                                    className={`flex items-center space-x-2 ${
                                      hasLiked
                                        ? "text-red-500"
                                        : "text-gray-500 hover:text-red-500"
                                    }`}
                                  >
                                    <Heart
                                      className={`w-5 h-5 ${
                                        hasLiked ? "fill-current" : ""
                                      }`}
                                    />
                                    <span className="text-sm Livvic-Medium">
                                      {post.likes?.length || 0}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => setActivePostId(post._id)}
                                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="text-sm Livvic-Medium">
                                      {post.comments?.length || 0}
                                    </span>
                                  </button>

                                  {/* <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                                <Share className="w-5 h-5" />
                                <span className="text-sm Livvic-Medium hidden sm:inline">Share</span>
                              </button> */}
                                </div>

                                {currentUserId === post.createdBy && (
                                  <button
                                    onClick={() => {
                                      setDeleteCommentId(null);
                                      setDeletePostId(post._id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-500 hover:text-red-600 text-sm Livvic-Medium"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Hidden on mobile, only show when no post is selected on desktop */}
            {!activePostId && (
              <div className="hidden lg:block w-80 space-y-6">
                {/* Popular Topics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className=" text-lg Livvic-SemiBold mb-4">
                    Popular Topics
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {Array.isArray(localCommunities) &&
                      localCommunities
                        .flatMap((comm) => comm.topics || [])
                        .slice(0, 8)
                        .map(
                          (topic) =>
                            topic.name !== "Admin" && (
                              <div
                                key={topic._id}
                                className={`flex items-center justify-between py-2 px-4 border border-[#EEEEEE] w-fit rounded-full cursor-pointer ${selectedTopic === topic.name && "bg-primary"}`}
                                onClick={() => setSelectedTopic(topic.name)}
                              >
                                <p className="Livvic-Medium text-[#555555] text-sm">
                                  {topic.name}
                                </p>
                              </div>
                            )
                        )}
                  </div>
                </div>

                {/* Active Discussions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg Livvic-SemiBold mb-4">
                    Active discussions
                  </h3>
                  <div className="space-y-2">
                    {filteredPosts.slice(0, 4).map((post) => {
                      const creator = postCreators[post.createdBy];
                      return (
                        <div
                          key={post._id}
                          className="flex items-start space-x-3"
                        >
                          {/* <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div> */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#333333] line-clamp-2 whitespace-pre-wrap break-words">
                              {post.description.length > 50
                                ? `${post.description.substring(0, 50)}...`
                                : post.description}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">
                                    {post.likes?.length || 0}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageCircle className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-500">
                                    {post.comments?.length || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Plus Button for Mobile */}
      <button
        onClick={() => setIsCreatePostModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 md:hidden z-40 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Reply Modal */}
      <Transition.Root show={isReplyModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsReplyModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg Livvic-Medium leading-6 text-gray-900 mb-4"
                  >
                    Reply to Comment
                  </Dialog.Title>

                  {quotedText && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 italic">
                        "{quotedText}"
                      </p>
                    </div>
                  )}

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    rows={4}
                  />

                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    Reply anonymously
                  </label>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsReplyModalOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full Livvic-Medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostCommentReply}
                      disabled={!replyText.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm Livvic-Medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reply
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Create Post Modal for Mobile */}
      <Transition.Root show={isCreatePostModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsCreatePostModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-full sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-full sm:scale-95"
              >
                <Dialog.Panel className="w-full sm:max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-xl Livvic-Bold text-gray-900">
                      Create Post
                    </h3>
                    <button
                      onClick={() => setIsCreatePostModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-start space-x-3">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          name={user?.name || "User"}
                          size="40"
                          round
                          className="text-white"
                          color="#3B82F6"
                        />
                      )}
                      <div className="flex-1">
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full text-gray-700 placeholder-gray-500 resize-none border-none outline-none text-lg min-h-32"
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Topic Selection */}
                    <div className="mt-4 space-y-4">
                      <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-3"
                      >
                        <option value="">Select Topic</option>
                        {Array.isArray(communities) &&
                          communities
                            .flatMap((comm) =>
                              (comm.topics || []).map((topic) => ({
                                ...topic,
                                communityName: comm.name,
                              }))
                            )
                            .slice(0, 10)
                            .map(
                              (topic) =>
                                topic.name !== "Admin" && (
                                  <option key={topic._id} value={topic._id}>
                                    {topic.name} — {topic.communityName}
                                  </option>
                                )
                            )}
                      </select>

                      {/* Anonymous Toggle */}
                      <label className="flex items-center gap-3 text-gray-700">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>Post anonymously</span>
                      </label>

                      {/* Media Upload */}
                      <div className="flex items-center space-x-4">
                        <input
                          id="modal-media-upload"
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) =>
                            setMediaFiles(Array.from(e.target.files))
                          }
                          className="hidden"
                        />
                        <label
                          htmlFor="modal-media-upload"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer py-2 px-4 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          <Image className="w-5 h-5" />
                          <span className="text-sm Livvic-Medium">
                            Add Photos/Videos
                          </span>
                        </label>
                      </div>

                      {/* Media Preview */}
                      {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {mediaFiles.slice(0, 4).map((file, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-lg overflow-hidden"
                            >
                              {/* <div
                                onClick={() =>
                                  setMediaFiles((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="absolute top-1 right-1 z-30 cursor-pointer w-fit p-1 rounded-full bg-[#151515]"
                              >
                                <X className=" text-gray-200 w-4 h-4" />
                              </div> */}
                              {file.type.startsWith("image") ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={URL.createObjectURL(file)}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                              )}
                              <button
                                onClick={() =>
                                  setMediaFiles((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {postContent.length}/500 characters
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsCreatePostModalOpen(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full Livvic-Medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={!postContent.trim() || !selectedTopic}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm Livvic-Medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Share Post
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Confirmation Dialog */}
      <Transition.Root show={isDeleteDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg Livvic-Medium leading-6 text-gray-900 mb-4"
                  >
                    {deletePostId ? "Delete Post" : "Delete Comment"}
                  </Dialog.Title>

                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete this{" "}
                    {deletePostId ? "post" : "comment"}? This action cannot be
                    undone.
                  </p>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full Livvic-Medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={
                        deletePostId ? handleDeletePost : handleDeleteComment
                      }
                      disabled={isDeletingPost}
                      className="bg-red-600 text-white px-6 py-2 rounded-full text-sm Livvic-Medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeletingPost && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default PaginationComm;
