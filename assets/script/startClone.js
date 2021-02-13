
const TouchType = {
    Inside:1,
    InEdge:2,
    Outside:3
}

cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    initData:function() {
        this.touchFirstPos = null;      //咪牌的第一个坐标点
        this.rotateFirstPos = null;     //旋转牌第一个坐标点
        this.pukeDisRatio = 0.1;        //扑克边缘的大小比例(意思就是获取图片的宽度或高度的1/10为边缘大小)
    },

    start () {
        cc.dynamicAtlasManager.enabled = false;

        this.initData();

        this.labelAngle = this.node.getChildByName("labelAngle").getComponent(cc.Label);

        this._bgMaterialNode = this.node.getChildByName("cardBg");
        this._zmMaterialNode = this._bgMaterialNode.getChildByName("cardNum");
        this._bgMaterial = this._bgMaterialNode.getComponent(cc.Sprite).getMaterials()[0];
        this._zmMaterial = this._zmMaterialNode.getComponent(cc.Sprite).getMaterials()[0];

        //设置设置阴影部分的最大距离,取图片宽度的10分一座位距离
        let shadowDis = this._bgMaterialNode.width*this._bgMaterialNode.scaleX*0.1
        this._zmMaterial.effect.setProperty('shadowDis', shadowDis);

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
    //这个功能其实可以使用cocos的PolygonCollider组件实现多边形点击判断，但是考虑用的扑克大小可能不一样，一个一个点编辑太麻烦了，用代码实现兼容性更好点
    getTouchTypeByNode:function(pos,node){
        //这里要把扑克的坐标转换成世界坐标，方便判断触摸点是否在扑克内
        let nodePos = node.convertToWorldSpaceAR(cc.v2(0,0));
        let anchorX = node.anchorX;
        let anchorY = node.anchorY;
        let angle = node.angle;
        //图片的宽
        let pWidth = node.width*node.scaleX;
        //图片的高
        let pHeight = node.height*node.scaleY;
        //获取边缘的宽度
        let disWidth = Math.max(10,pWidth*this.pukeDisRatio);    //最小10像素
        //获取边缘的高度
        let disHeight = Math.max(10,pHeight*this.pukeDisRatio);  //最小10像素
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

        //外部的x和y坐标列表
        let xlist = [left_up.x,left_bottom.x,right_bottom.x,right_up.x];
        let ylist = [left_up.y,left_bottom.y,right_bottom.y,right_up.y];
        //内部的x和y坐标列表
        let xlistInside = [inside_left_up.x,inside_left_bottom.x,inside_right_bottom.x,inside_right_up.x];
        let ylistInside = [inside_left_up.y,inside_left_bottom.y,inside_right_bottom.y,inside_right_up.y];
        //如果点在扑克范围 并且 不在内部范围 就是边缘范围
        if (this.isInside(4,xlist,ylist,pos) && !this.isInside(4,xlistInside,ylistInside,pos)){
            return TouchType.InEdge;
        }else if (this.isInside(4,xlistInside,ylistInside,pos)){
            return TouchType.Inside;
        }
        return TouchType.Outside;
    },

    //重置坐标
    resetPos:function(){
        let initPos = cc.v2(0,0);
        this._bgMaterial.effect.setProperty('firstPos',initPos);
        this._bgMaterial.effect.setProperty('secondPos',initPos);
        this._zmMaterial.effect.setProperty('firstPos', initPos);
        this._zmMaterial.effect.setProperty('secondPos', initPos);
    },

    //传入两个点
    runActionCard:function(firstPos,secondPos){
        this._bgMaterial.effect.setProperty('firstPos',firstPos);
        this._bgMaterial.effect.setProperty('secondPos',secondPos);
        this._zmMaterial.effect.setProperty('firstPos', firstPos);
        this._zmMaterial.effect.setProperty('secondPos', secondPos);
    },

    //获取角度
    getAngleByPos:function(pos1,pos2){
        var disX = pos2.x - pos1.x;
        var disY = pos2.y - pos1.y;
        if (disX == 0){
            if (disY > 0){
                return 90;
            }else{
                return 180;
            }
        }
        //获取正切值
        var tanValue = Math.atan(disY/disX);
        var rotation = 180/Math.PI*tanValue;
        return rotation;
    },

    //设置旋转角度
    runRatationAction:function(firstPos,secondPos){
        let originPos = this._bgMaterialNode.convertToWorldSpaceAR(cc.v2(0,0));;
        let angle_1 = this.getAngleByPos(originPos,firstPos);
        let angle_2 = this.getAngleByPos(originPos,secondPos);
        this._bgMaterialNode.angle = this.backAngle + (angle_2 - angle_1);
        this.labelAngle.string = this._bgMaterialNode.angle;
    },


    touchBegan:function(event){
        let pos = event.getLocation();
        let touchTp = this.getTouchTypeByNode(pos,this._bgMaterialNode);
        //如果是边缘范围,把当前点击的坐标赋值给this.touchFirstPos
        if (touchTp == TouchType.Inside){   //如果是点击内部区域
            this.rotateFirstPos = pos;
            this.backAngle = this._bgMaterialNode.angle;
        }else if (touchTp == TouchType.InEdge){   //点击边缘区域
            this.touchFirstPos = pos;
        }
    },

    touchMove:function(event){
        let pos = event.getLocation();
        //只有在第一点存在的情况下，也就是已经触摸过牌的边缘的情况下才处理搓牌动画
        if (this.touchFirstPos){
            this.runActionCard(this.touchFirstPos,pos);
        }else if (this.rotateFirstPos){
            this.runRatationAction(this.rotateFirstPos,pos);
        }else{
            let touchTp = this.getTouchTypeByNode(pos,this._bgMaterialNode);
            //如果是边缘范围,把当前点击的坐标赋值给this.touchFirstPos
            if (touchTp == TouchType.InEdge){
                this.touchFirstPos = pos;
            }
        }

    },

    touchEnded:function(event){
        this.touchFirstPos = null;
        this.rotateFirstPos = null;
        this.resetPos();
    },

    touchCancel:function(event){
        this.touchFirstPos = null;
        this.rotateFirstPos = null;
        this.resetPos();
    },

    
});

