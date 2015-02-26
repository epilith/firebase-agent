

exports.flows = {
  "linkComments": {
    in: "comments",
    out: ["posts/$post/comments/$_key", "users/$user/comments/$_key"],
    value: true,
    onDelete: "cascade"
  }
}
