
module.exports = function (content) {
    return new ApiResponseBody(content);
}

function ApiResponseBody(content) {
    this.content = content;
    this.msg = '';
    this.success = true
}

ApiResponseBody.prototype.done = function () {
    var data;
    if (typeof this.content === 'object') {
        data = JSON.stringify(this.content);
    } else {
        data = this.content;
    }
    return JSON.stringify({
        data: this.content,
        msg: this.msg,
        success: this.success
    });
}

ApiResponseBody.prototype.failed = function () {
    this.success = false;
    return this;
}

ApiResponseBody.prototype.successful = function () {
    this.success = true;
    return this;
}

ApiResponseBody.prototype.message = function (msg) {
    this.msg = msg;
    return this;
}
