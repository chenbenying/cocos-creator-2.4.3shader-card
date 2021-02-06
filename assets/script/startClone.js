



cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    initData:function() {
        this.touchFirstPos = null;      //咪牌的第一个坐标点
        this.touchSecondPos = null;     //咪牌的第二个坐标点
        this.pukeDisRatio = 0.1;        //扑克边缘的大小比例(意思就是获取图片的宽度或高度的1/10为边缘大小)
    },

    start () {
        cc.dynamicAtlasManager.enabled = false;

        this.initData();

        this._bgMaterialNode = this.node.getChildByName("cardBg")
        this._zmMaterialNode = this._bgMaterialNode.getChildByName("cardNum")
        this._bgMaterial = this._bgMaterialNode.getComponent(cc.Sprite).getMaterials()[0];
        this._zmMaterial = this._zmMaterialNode.getComponent(cc.Sprite).getMaterials()[0];
        this.initBox = this._bgMaterialNode.getBoundingBoxToWorld();
        this.box = this._bgMaterialNode.getBoundingBoxToWorld();
        //cc.log(">>>>>>>>this.box",this.box,this._bgMaterialNode.width)

        this.touchLayer = this.node.getChildByName("touchLayer");

        this.touchLayer.on(cc.Node.EventType.TOUCH_START,this.touchBegan,this);
        this.touchLayer.on(cc.Node.EventType.TOUCH_MOVE,this.touchMove,this);
        this.touchLayer.on(cc.Node.EventType.TOUCH_END,this.touchEnded,this)
        this.touchLayer.on(cc.Node.EventType.TOUCH_CANCEL,this.touchCancel,this)
    },

    //获取旋转后的坐标点 originPos原点坐标(可以看成图片坐标)  
    //                  tagerPos需要转换的坐标点 
    //                  angle旋转角度
    getRotatePos:function(originPos,tagerPos,angle){
        let val = angle/(180/Math.PI); //这里要把角度转弧度,代码Math.sin等三角函数的参数都是弧度;
        let disPos = cc.v2(tagerPos.x-originPos.x,tagerPos.y-originPos.y);
        let rPos = cc.v2(0.0,0.0);
        rPos.x = disPos.x*Math.cos(val) - disPos.y*Math.sin(val);
        rPos.y = disPos.x*Math.sin(val) + disPos.y*Math.cos(val);
        rPos.x = rPos.x + originPos.x;
        rPos.y = rPos.y + originPos.y;
        return rPos
    },

    //判断一个点是否在多边形内
    // posCount多边形的顶点数量
    // xlist顶点的x坐标列表
    // ylist顶点的y坐标列表
    // pos需要判断的点坐标
    isInside:function(posCount,xlist,ylist,pos){
        let rbool = false;
        let j = posCount -1;
        for (let i = 0 ; i < posCount ; j = i++){
            let ybool = (ylist[i] > pos.y) != (ylist[j] > pos.y);
            let xbool = pos.x < (xlist[j] - xlist[i])*(pos.y-ylist[i])/(ylist[j]-ylist[i])+xlist[i];
            if (ybool && xbool ){
                rbool = !rbool
            }
        }

        return rbool;
    },

    //判断一个点是否在扑克的边缘范围内(这里要考虑扑克旋转任意角度)
    isInEdgeByNode:function(pos,node){
        //这里要把扑克的坐标转换成世界坐标，方便判断触摸点是否在扑克内
        let nodePos = node.convertToWorldSpaceAR(cc.v2(0,0));
        let anchorX = node.anchorX;
        let anchorY = node.anchorY;
        let angle = node.angle;
        //cc.log(">>>>>>>>>>>>>node.width:",node.width);
        //图片的宽
        let pWidth = node.width*node.scaleX;
        //图片的高
        let pHeight = node.height*node.scaleY;
        //获取边缘的宽度
        let disWidth = Math.max(10,pWidth*this.pukeDisRatio);    //最小10像素
        //获取边缘的高度
        let disHeight = Math.max(10,pHeight*this.pukeDisRatio);  //最小10像素
        // cc.log(">>>>>>angle:",angle);
        // cc.log(">>>>>>disWidth:",disWidth);
        // cc.log(">>>>>>disHeight:",disHeight);
        //获取扑克整体的四个顶点坐标(逆时针获取)
        //----左上角
        let left_up = cc.v2(-pWidth*anchorX+nodePos.x,pHeight*(1-anchorY)+nodePos.y);
        //----左下角
        let left_bottom = cc.v2(-pWidth*anchorX+nodePos.x,-pHeight*anchorY+nodePos.y);
        //----右下角
        let right_bottom = cc.v2(pWidth*(1-anchorX)+nodePos.x,-pHeight*anchorY+nodePos.y);
        //----右上角
        let right_up = cc.v2(pWidth*(1-anchorX)+nodePos.x,pHeight*(1-anchorY)+nodePos.y);

        //获取扑克去掉边缘的内部四个顶点坐标(逆时针获取)
        //----内部左上角
        let inside_left_up = cc.v2(left_up.x+disWidth ,left_up.y-disHeight);
        //----内部左下角
        let inside_left_bottom = cc.v2(left_bottom.x+disWidth , left_bottom.y+disHeight);
        //----内部右下角
        let inside_right_bottom = cc.v2(right_bottom.x-disWidth , right_bottom.y+disHeight);
        //----内部右上角
        let inside_right_up = cc.v2(right_up.x-disWidth , right_up.y-disHeight);

        //获取旋转后的坐标
        left_up = this.getRotatePos(nodePos,left_up,angle);
        left_bottom = this.getRotatePos(nodePos,left_bottom,angle);
        right_bottom = this.getRotatePos(nodePos,right_bottom,angle);
        right_up = this.getRotatePos(nodePos,right_up,angle);

        inside_left_up = this.getRotatePos(nodePos,inside_left_up,angle);
        inside_left_bottom = this.getRotatePos(nodePos,inside_left_bottom,angle);
        inside_right_bottom = this.getRotatePos(nodePos,inside_right_bottom,angle);
        inside_right_up = this.getRotatePos(nodePos,inside_right_up,angle);

        // cc.log(">>>>>>>>>>>left_up:",left_up);
        // cc.log(">>>>>>>>>>>left_bottom:",left_bottom);
        // cc.log(">>>>>>>>>>>right_bottom:",right_bottom);
        // cc.log(">>>>>>>>>>>right_up:",right_up);

        // cc.log("------------------------------:");

        // cc.log(">>>>>>>>>>>inside_left_up:",inside_left_up);
        // cc.log(">>>>>>>>>>>inside_left_bottom:",inside_left_bottom);
        // cc.log(">>>>>>>>>>>inside_right_bottom:",inside_right_bottom);
        // cc.log(">>>>>>>>>>>inside_right_up:",inside_right_up);

        //外部的x和y坐标列表
        let xlist = [left_up.x,left_bottom.x,right_bottom.x,right_up.x];
        let ylist = [left_up.y,left_bottom.y,right_bottom.y,right_up.y];
        //内部的x和y坐标列表
        let xlistInside = [inside_left_up.x,inside_left_bottom.x,inside_right_bottom.x,inside_right_up.x];
        let ylistInside = [inside_left_up.y,inside_left_bottom.y,inside_right_bottom.y,inside_right_up.y];
        //如果点在扑克范围 并且 不在内部范围 就是边缘范围
        if (this.isInside(4,xlist,ylist,pos) && !this.isInside(4,xlistInside,ylistInside,pos)){
            return true;
        }
        return false;
    },

    //传入两个点
    runActionCard:function(firstPos,secondPos){
        let node = this._bgMaterialNode
        let angle = node.angle;
        let nodePos = node.convertToWorldSpaceAR(cc.v2(0,0));
        //这里要转换一下坐标，用相对图片坐标百分比的坐标
        //在着色器中,图片的原点是在图片的左上角,向下是Y轴的正坐标(总长度为1),向右是X轴的正坐标(总长度为1)
        //原点的位置会跟随图片旋转，一直保持在图片位置左上角
        //我也不懂cocos着色器的坐标为什么这么设计,都是代码试出来确定的

        //所以，这里要获取两点旋转之前的坐标，角度相反就可以获取到(这里可以思考一下)
        firstPos = this.getRotatePos(nodePos,firstPos,-angle);
        secondPos = this.getRotatePos(nodePos,secondPos,-angle);
        //这里是获取图片未旋转之前的左上角坐标
        let anchorX = node.anchorX;
        let anchorY = node.anchorY;
        let pWidth = node.width*node.scaleX;
        let pHeight = node.height*node.scaleY;
        let left_up = cc.v2(-pWidth*anchorX+nodePos.x,pHeight*(1-anchorY)+nodePos.y);
        //获取百分比坐标
        firstPos.x = (firstPos.x - left_up.x)/pWidth;
        firstPos.y = (left_up.y - firstPos.y)/pHeight;  //向下是正方向,所以是left_up.y - firstPos.y
        secondPos.x = (secondPos.x - left_up.x)/pWidth;
        secondPos.y = (left_up.y - secondPos.y)/pHeight;  //向下是正方向,secondPos.y - secondPos.y

        //cc.log(">>>>>>>>>>>>firstPos:",firstPos);
        //cc.log(">>>>>>>>>>>>secondPos:",secondPos);
        //接下我们只要把参数传给着色器
        this._bgMaterial.effect.setProperty('firstPos',firstPos);
        this._bgMaterial.effect.setProperty('secondPos',secondPos);
        this._zmMaterial.effect.setProperty('firstPos', firstPos);
        this._zmMaterial.effect.setProperty('secondPos', secondPos);
    },

    touchBegan:function(event){
        let pos = event.getLocation();
        //cc.log(">>>>>>>>pos:",pos)
        let isInEdge = this.isInEdgeByNode(pos,this._bgMaterialNode);
        //cc.log(">>>>>>>>isInEdge:",isInEdge)
        //如果是边缘范围,把当前点击的坐标赋值给this.touchFirstPos
        if (isInEdge){
            this.touchFirstPos = pos;
        }
    },

    touchMove:function(event){
        let pos = event.getLocation();
        //只有在第一点存在的情况下，也就是已经触摸过牌的边缘的情况下才处理搓牌动画
        if (this.touchFirstPos){
            this.runActionCard(this.touchFirstPos,pos);
        }else{
            let isInEdge = this.isInEdgeByNode(pos,this._bgMaterialNode);
            //如果是边缘范围,把当前点击的坐标赋值给this.touchFirstPos
            if (isInEdge){
                this.touchFirstPos = pos;
            }
        }

    },

    touchEnded:function(event){
        this.touchFirstPos = null;
    },

    touchCancel:function(event){
        this.touchFirstPos = null;
    },

    
});

